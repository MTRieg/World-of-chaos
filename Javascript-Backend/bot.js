require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const { processSVG } = require('./main.js'); 
const { uploadFilesToGitHub } = require('./github_test.js');
const path = require('path');
const AdmZip = require('adm-zip');
const { generateFileNames } = require('./generateFileNames.js'); 
const { updateLocalMappings, mappings_update, svg_update } = require('./bot_imports.js');



let fetch;
(async () => {
  const fetchModule = await import('node-fetch');
  fetch = fetchModule.default;
})();


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}, ${process.env.SVG_UPLOAD_CHANNEL_ID}`);
  
});

const mappings = JSON.parse(fs.readFileSync('mappings.json', 'utf-8'));
const countryList = mappings.map(entry => entry.name);

const github_folder = 'WOC_test/';

let files = require('./file-names.js');
previous_files = files.files;


async function github_upload(edits){


  const filesToUpload = generateFileNames(previous_files, edits, github_folder);

  const modulePath = require.resolve('./file-names.js');
  delete require.cache[modulePath];
  files = require('./file-names.js');
  previous_files = files.files;

  uploadFilesToGitHub(filesToUpload);

}


client.on('messageCreate', async message => {
  if (message.author.bot) return;
  const args = message.content.trim().split(/\s+/);

  const symmetricRelations = {
  '!ally': 3,
  '!neutral': 1,
  '!war': 6,
  '!dualMonarchy': 4
  };

  const asymmetricRelations = {
    '!vassal': [2, 5]
  };

  if (args[0] in symmetricRelations || args[0] in asymmetricRelations) {
    if (args.length !== 3) {
      message.reply(`❌ Usage: \`${args[0]} country1 country2\``);
      return;
    }

    const [_, c1, c2] = args;
    const i1 = countryList.indexOf(c1);
    const i2 = countryList.indexOf(c2);

    const notFound = [];
    if (i1 === -1) notFound.push(`"${c1}"`);
    if (i2 === -1) notFound.push(`"${c2}"`);
    if (notFound.length > 0) {
      message.reply(`❌ Country${notFound.length > 1 ? 'ies' : ''} not found: ${notFound.join(', ')}`);
      return;
    }

    if (i1 === i2) {
      message.reply("❌ Usage: you can't change a country's relationship to itself");
      return;
    }

    

    if (args[0] in symmetricRelations) {
      const color = symmetricRelations[args[0]];
      updateLocalMappings(i1, i2, color, color);
    } else if (args[0] in asymmetricRelations) {
      const [c1Color, c2Color] = asymmetricRelations[args[0]];
      updateLocalMappings(i1, i2, c1Color, c2Color);
    }

    message.reply(`✅ Updated ${c1} and ${c2} to be ${args[0].slice(1)}.`);
    return;
  }

  if (message.content === '!uploadMappings') {
    
    mappings_update();
    
    message.reply('heard');


  }




 // Handle SVG uploads in a specific channel
  if (
    message.channel.id === process.env.SVG_UPLOAD_CHANNEL_ID && // Target channel ID from .env
    message.attachments.size > 0
  ) {
    const attachment = message.attachments.find(att => 
      att.name.toLowerCase().endsWith('.svg') || att.name.toLowerCase().endsWith('.zip'));

    if (!attachment) {
      return message.reply('❌ No .svg or .zip file found in the attachment.');
    }

  const fileName = attachment.name.toLowerCase();

  if (fileName.endsWith('.svg')) {
      // Download the SVG file
      const response = await fetch(attachment.url);
      const buffer = await response.buffer();
      fs.writeFileSync('input.svg', buffer); // Save as input.svg
      message.reply('✅ SVG file received. Processing...');

      svg_update();

      message.reply(`Done uploading (though the build might still take ~60 seconds)`);


    
  }else if (fileName.endsWith('.zip')) {
    // ZIP file attached — download and extract first SVG
    const zipPath = path.join(__dirname, 'temp.zip');
    const zipResponse = await fetch(attachment.url);
    const zipBuffer = await zipResponse.buffer();
    fs.writeFileSync(zipPath, zipBuffer);

    const zip = new AdmZip(zipPath);
    const svgEntry = zip.getEntries().find(entry =>
      !entry.isDirectory && entry.entryName.toLowerCase().endsWith('.svg')
    );

    if (!svgEntry) {
      return message.reply('❌ No .svg file found inside the zip.');
    }

    fs.writeFileSync('input.svg', zip.readFile(svgEntry)); // Save extracted SVG as input.svg
    message.reply(`✅ Extracted ${svgEntry.entryName} from zip. Processing...`);
    
    
    svg_update();

  }


}else if(message.channel.id === process.env.SVG_UPLOAD_CHANNEL_ID){ // Target channel ID from .env)
  await message.reply('no file');
}

});


client.login(process.env.DISCORD_TOKEN);

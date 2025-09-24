require('dotenv').config();
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const { processSVG } = require('./main.js'); 
const { uploadFilesToGitHub } = require('./github_test.js');
const { generateFileNames } = require('./generateFileNames.js'); 


// Set up GitHub API access
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });


// Get the country list from mappings
const mappingsData = JSON.parse(fs.readFileSync('mappings.json', 'utf-8'));
const countryList = mappingsData.map(entry => entry.name);

const github_folder = process.env.GITHUB_FILE_PATH;

// Track the list of previously uploaded files
let files = require('./file-names.js');
let previous_files = files.files;

// Upload files to GitHub after generating updated filenames
async function github_upload(edits) {

  const filesToUpload = await generateFileNames(previous_files, edits, github_folder);

  // Force re-import of updated file list
  const modulePath = require.resolve('./file-names.js');
  delete require.cache[modulePath];
  files = require('./file-names.js');
  previous_files = files.files;

  await uploadFilesToGitHub(filesToUpload);  // Await upload for proper sequencing
}

// Updates the local mappings file with mutual visibility colors
function updateLocalMappings(country1, country2, color1, color2) {
  let i1, i2;

  if (typeof country1 === "string") {
    i1 = countryList.indexOf(country1);
  } else {
    i1 = country1;
  }

  if (typeof country2 === "string") {
    i2 = countryList.indexOf(country2);  // ✅ FIXED: used to incorrectly reference country1
  } else {
    i2 = country2;
  }

  const mappings = JSON.parse(fs.readFileSync('mappings.json', 'utf-8'));

  mappings[i1].mapping[i2] = color2;
  mappings[i2].mapping[i1] = color1;

  fs.writeFileSync('mappings.json', JSON.stringify(mappings, null, 2));
  console.log("Updated local copy of mappings");
}

// Uploads the current local mappings file to GitHub
function mappings_update() {
  const uploads = {
    mappingsJson: "mappings.json",
  };

  github_upload(uploads);
}

// Processes an SVG and uploads the resulting image files
async function svg_update(svg_filename = 'input.svg') {
  await processSVG('outline.png', 'no-outline.png', 'clickable.png', 'swap-ref.png', svg_filename);

  const uploads = {
    outlineImage: "outline.png",
    clickableImage: "clickable.png",
    baseImage: "no-outline.png",
    swapRefImage: "swap-ref.png",
  };

  github_upload(uploads);
}

// Export utility functions
module.exports = { updateLocalMappings, mappings_update, svg_update };
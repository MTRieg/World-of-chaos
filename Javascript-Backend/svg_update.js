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

svg_update();
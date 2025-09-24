const fs = require('fs');
const path = require('path');
const {loadFromGitHub} = require('./github_test');

// Helper: Generate UTC timestamp like 20250603_193000
function getTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
}

// Helper: Insert timestamp before extension in a file path and add files location
function appendTimestampAndFilesFolder(filepath, timestamp, files_location) {
  const ext = path.extname(filepath);                    // e.g., .png
  const base = path.basename(filepath, ext);             // e.g., clickable
  const dir = path.posix.dirname(filepath);              // always forward slashes
  return `${dir}/${files_location}${base}_${timestamp}${ext}`;
}

// Main function
async function generateFileNames(previous, edits, github_folder, files_location = 'files/') {
  await loadFromGitHub(github_folder + 'file-names.js', './file-names.js');
  
  const output = {};
  const uploadList = [];
  const timestamp = getTimestamp();

  for (const key in previous) {
    const originalPath = previous[key];

    if (edits.hasOwnProperty(key)) {
      const editedPath = edits[key]; // This is the path on disk, unmodified
      const updatedPath = appendTimestampAndFilesFolder(editedPath, timestamp, files_location);

      output[key] = updatedPath;

      // Add to upload list
      uploadList.push({
        path: editedPath,
        githubPath: `${github_folder}${files_location}${path.posix.basename(updatedPath)}`
      });
    } else {
      output[key] = originalPath;
    }
  }

  // Write file-names.js
  const lines = [
    '// file-names.js',
    'export const files = {'
  ];

  for (const [key, value] of Object.entries(output)) {
    lines.push(`  ${key}: "${value}",`);
  }

  lines.push('};\n');
  fs.writeFileSync('file-names.js', lines.join('\n'), 'utf8');

  // Also upload file-names.js
  uploadList.push({
    path: 'file-names.js',
    githubPath: `${github_folder}file-names.js`
  });

  console.log('✅ file-names.js has been written.');
  return uploadList;
}

module.exports = {generateFileNames};


/*
// Example usage:
const previous = {
  outlineImage: "./files/outline.png",
  clickableImage: "./files/clickable.png",
  baseImage: "./files/no-outline.png",
  swapRefImage: "./files/swap-ref.png",
  palettesJson: "./files/palettes.json",
  mappingsJson: "./files/mappings.json"
};

const edits = {
  clickableImage: "clickable.png",
  mappingsJson: "mappings.json"
};

const github_folder = 'WOC_test/';
const files_location = 'files/'
const filesToUpload = generateFileNames(previous, edits, github_folder, files_location);

console.log('🗃 Files to upload:');
console.log(filesToUpload);
*/

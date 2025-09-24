// Import required modules
const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises; // Use promises version for async/await
require('dotenv').config();
const path = require('path');

// === CONFIGURATION ===
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = process.env.GITHUB_OWNER;     // e.g., 'my-username'
const REPO = 'World-of-chaos';      // e.g., 'my-repo'
const BRANCH = 'main';                    // The branch you want to commit to



const TEXT_FILE_EXTENSIONS = new Set([
  '.txt', '.md', '.js', '.ts', '.json', '.html', '.css', '.xml', '.csv', '.yml', '.yaml',
]);

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_FILE_EXTENSIONS.has(ext);
}

/**
 * Uploads multiple files to a GitHub repository in a single commit.
 * @param {Array} filesToUpload - Array of objects: { path: 'local/file/path', githubPath: 'path/in/repo' }
 */
async function uploadFilesToGitHub(filesToUpload) {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    // Get the latest commit SHA and base tree
    const { data: refData } = await octokit.git.getRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${BRANCH}`,
    });
    const latestCommitSha = refData.object.sha;

    const { data: commitData } = await octokit.git.getCommit({
      owner: OWNER,
      repo: REPO,
      commit_sha: latestCommitSha,
    });
    const baseTreeSha = commitData.tree.sha;

    console.log(`Latest commit: ${latestCommitSha}`);
    console.log(`Base tree: ${baseTreeSha}`);

    // Create blobs for each file (binary-safe)
    const blobs = [];
    for (const file of filesToUpload) {
      const buffer = await fs.readFile(file.path);
      const isText = isTextFile(file.path);
      const content = isText ? buffer.toString('utf8') : buffer.toString('base64');
      const encoding = isText ? 'utf-8' : 'base64';

      const blob = await octokit.git.createBlob({
        owner: OWNER,
        repo: REPO,
        content,
        encoding,
      });
      
    blobs.push({ blobSha: blob.data.sha, path: file.githubPath });
    console.log(`Created ${encoding} blob for ${file.path}`);

    }
    // Create a new tree
    const tree = blobs.map((b) => ({
      path: b.path,
      mode: '100644',
      type: 'blob',
      sha: b.blobSha,
    }));

    const { data: newTree } = await octokit.git.createTree({
      owner: OWNER,
      repo: REPO,
      tree: tree,
      base_tree: baseTreeSha,
    });

    console.log(`Created new tree: ${newTree.sha}`);

    // Create a new commit
    const commitMessage = 'Upload multiple files in a single commit';
    const { data: newCommit } = await octokit.git.createCommit({
      owner: OWNER,
      repo: REPO,
      message: commitMessage,
      tree: newTree.sha,
      parents: [latestCommitSha],
    });

    console.log(`Created new commit: ${newCommit.sha}`);

    // Update the branch reference
    await octokit.git.updateRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${BRANCH}`,
      sha: newCommit.sha,
    });

    console.log('✅ Files uploaded and branch updated!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// === Run function directly if this file is executed ===
if (require.main === module) {
  const filesToUpload = [
    { path: 'no-outline.png', githubPath: 'output/no-outline.png' },
    { path: 'outline.png', githubPath: 'output/outline.png' },
    { path: 'clickable.png', githubPath: 'output/clickable.png' },
    { path: 'overlay.png', githubPath: 'output/overlay.png' },
  ];

  uploadFilesToGitHub(filesToUpload);
}

async function loadFromGitHub(github_location, local_location) {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    // Get the file's content from GitHub
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: github_location,
      ref: BRANCH,
    });

    // File content comes in base64 format from GitHub
    const fileContent = Buffer.from(data.content, 'base64');

    // Ensure local directory exists
    const localDir = path.dirname(local_location);
    await fs.mkdir(localDir, { recursive: true });

    // Write to local file system
    await fs.writeFile(local_location, fileContent);

    console.log(`✅ Downloaded '${github_location}' to '${local_location}'`);
  } catch (error) {
    console.error(`❌ Failed to load '${github_location}':`, error.message);
  }
}

// Export the function for use in other files
module.exports = { uploadFilesToGitHub, loadFromGitHub };

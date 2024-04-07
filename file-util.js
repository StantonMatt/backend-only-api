'use strict';

const fs = require('fs-extra');
const path = require('path');

async function waitForFileReady(filePath, timeout = 30000) {
  const start = Date.now();
  let size = null;

  while (Date.now() - start < timeout) {
    try {
      const stats = await fs.stat(filePath);
      if (size === null) {
        size = stats.size;
      } else if (size === stats.size) {
        console.log('Unsigned XMLs ready for signing!');
        return true; // File size stable, assume readiness
      } else {
        size = stats.size; // Update size for next check
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error; // Rethrow errors other than file not existing
    }
    console.log('Saving unsigned XMLs to disk...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit before retrying
  }

  throw new Error(`Timeout waiting for file ${filePath} to be ready.`);
}

// Utility function to delay execution
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function tryDelete(filePath, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    try {
      await fs.unlink(filePath);
      // console.log('Deleted file:', filePath);
      return;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('File already deleted:', filePath);
        return;
      }
      if (i < attempts - 1) {
        console.log(`Attempt ${i + 1} failed, retrying...`);
        await delay(500); // Wait before retrying
      } else {
        throw error; // Rethrow after last attempt
      }
    }
  }
}

async function clearOldFiles(folderPath) {
  try {
    const files = await fs.readdir(folderPath);
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      await tryDelete(filePath);
    }
    console.log(`Old ${folderPath.slice(folderPath.lastIndexOf('\\') + 1)} files deleted: ${files.length}`);
  } catch (error) {
    console.log(`Error deleting files: ${error}`);
  }
}

module.exports = { waitForFileReady, clearOldFiles };

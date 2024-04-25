'use strict';

const { log } = require('console');
const fs = require('fs-extra');
const path = require('path');
const paths = require('./paths.js');

const primerFolioDisponiblePath = paths.getPrimerFolioDisponiblePath();

async function getPrimerFolioDisponible() {
  return await fs.readFile(primerFolioDisponiblePath, 'utf8');
}

async function waitForFileReady(filePath, timeout = 30000) {
  const start = Date.now();
  let size = null;

  while (Date.now() - start < timeout) {
    try {
      const logOutput = [];
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

async function clearOldFiles(folderPathsArray) {
  try {
    let logOutput = [];
    for (const folderPath of folderPathsArray) {
      const files = await fs.readdir(folderPath);
      for (const file of files) {
        const filePath = path.join(folderPath, file);
        await tryDelete(filePath);
      }
      logOutput.push(`${folderPath.slice(folderPath.lastIndexOf('\\') + 1)} files deleted: ${files.length}`);
      console.log(`${folderPath.slice(folderPath.lastIndexOf('\\') + 1)} files deleted: ${files.length}`);
    }
    return logOutput;
  } catch (error) {
    console.log(`Error deleting files: ${error}`);
  }
}

async function checkFileExists(file) {
  try {
    await fs.access(file, fs.constants.F_OK);
    console.log('Files found');
    return true;
  } catch (error) {
    console.log(`ERROR: The file does not exist: ${error}`);
    return false;
  }
}

module.exports = { getPrimerFolioDisponible, waitForFileReady, clearOldFiles, checkFileExists };

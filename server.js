'use strict';

const cors = require('cors');
const path = require('path');

const paths = require('./paths.js');
const { buildClientDte } = require('./generate-sobre.js');
const { signXml } = require('./signer.js');
const { waitForFileReady, clearOldFiles } = require('./util-file.js');
const { getFormData } = require('./generate-form.js');
const { buildRcof } = require('./generate-rcof.js');
const { generateBarcodes } = require('./generate-timbres.js');

const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);
const fs = require('fs-extra');
const axios = require('axios');
const { create, convert } = require('xmlbuilder2');

const signedSemillaXmlPath = paths.getSignedSemillaXmlPath();
const trackidPath = paths.getBoletaTrackidPath();
const tokenPath = paths.getTokenPath();
const signedBoletaDtePath = paths.getSignedBoletaDteFolderPath();
const unsignedBoletaDtePath = paths.getUnsignedBoletaDteFolderPath();
const sobreBoletaPath = paths.getSobreBoletaFolderPath();
const timbresBoletaFolderPath = paths.getTimbresBoletaFolderPath();
const dllPath = paths.getDllPath();

const foldersToDelete = [sobreBoletaPath, signedBoletaDtePath, unsignedBoletaDtePath, timbresBoletaFolderPath];

const express = require('express');
const app = express();
const port = 5000;

app.use(cors());

app.get('/api/delete-files', async (req, res) => {
  await clearOldFiles(foldersToDelete);
});

app.get('/api/generate-dtes', async (req, res) => {
  await buildClientDte();
});

app.get('/api/generate-sobre', async (req, res) => {
  const fileExists = await checkFileExists(unsignedBoletaDtePath + '\\dte1.xml');
  if (fileExists) {
    await waitForFileReady(unsignedBoletaDtePath + '\\dte1.xml');
    await compileAndSignSobre();
  } else {
    res.end(`File exists: ${fileExists}`);
  }
});

app.get('/api/generate-rcof', async (req, res) => {
  await buildRcof();
});

app.get('/api/generate-barcodes', async (req, res) => {
  await generateBarcodes();
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

async function compileAndSignSobre() {
  try {
    const { stdout, stderr } = await execAsync(`dotnet ${dllPath}`);
    console.log('MakeEnvio.cs console logs:\n', stdout);
    if (stderr) {
      console.error('ERROR MakeEnvio.cs logs:\n', stderr);
    }
  } catch (error) {
    console.log(`Error running C# .dll to sign DTE's: ${error}`);
  }
}

async function checkFileExists(file) {
  try {
    await fs.access(file, fs.constants.F_OK);
    console.log('The file exists.');
    return true;
  } catch {
    console.log('The file does not exist.');
    return false;
  }
}

async function run() {
  try {
    await clearOldFiles(foldersToDelete);
    const semillaData = await getSemilla();
    const semilla = await processSemillaResponse(semillaData);
    const semillaXml = await createSemillaXml(semilla);
    const signedSemillaXml = await signSemillaXml(semillaXml);
    const tokenData = await getToken(signedSemillaXml);
    await processTokenResponse(tokenData);
    await generateDteXmls();
    await waitForFileReady(unsignedBoletaDtePath + '\\dte1.xml'); // Ensure the file is ready before proceeding
    await compileAndSignSobre();
    await buildRcof();
    await generateBarcodes();
    // await postSignedSobreXml();
    // await getStatus();
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    // Handle the error appropriately, perhaps by retrying or aborting the process
  }
}

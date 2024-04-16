'use strict';

const cors = require('cors');
const path = require('path');

const main = require('./app.js');
const paths = require('./paths.js');
const { buildClientDte } = require('./generate-dtes.js');
const { waitForFileReady, clearOldFiles, checkFileExists } = require('./util-file.js');
const { buildRcof } = require('./generate-rcof.js');
const { generateBarcodes } = require('./generate-timbres.js');
const { compileAndSignSobre } = require('./generate-sobre.js');

const fs = require('fs-extra');

const signedBoletaDtePath = paths.getSignedBoletaDteFolderPath();
const unsignedBoletaDtePath = paths.getUnsignedBoletaDteFolderPath();
const sobreBoletaPath = paths.getSobreBoletaFolderPath();
const timbresBoletaFolderPath = paths.getTimbresBoletaFolderPath();
const boletaSobreFolderPath = paths.getSobreBoletaFolderPath();

const foldersToDelete = [sobreBoletaPath, signedBoletaDtePath, unsignedBoletaDtePath, timbresBoletaFolderPath];

const express = require('express');
const app = express();
const port = 5000;

app.use(cors());

app.use('/files', express.static('public'));

app.get('/api/list', (req, res) => {
  const directoryPath = path.join(__dirname, 'public');

  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      res.status(500).send({
        message: 'Unable to scan files!',
        error: err,
      });
    } else {
      let fileList = files.map(file => {
        return { name: file, url: `/files/${file}` };
      });
      res.send(fileList);
    }
  });
});

app.get('/api/get-token', async (req, res) => {
  const logOutput = [];
  const { semillaData, getSemillaLog } = await main.getSemilla();
  const { semilla, processSemillaResponseLog } = await main.processSemillaResponse(semillaData);
  const { semillaXml, createSemillaXmlLog } = await main.createSemillaXml(semilla);
  const { signedSemillaXml, signSemillaXmlLog } = await main.signSemillaXml(semillaXml);
  const { tokenData, getTokenLog } = await main.getToken(signedSemillaXml);
  const { token, processTokenResponseLog } = await main.processTokenResponse(tokenData);
  logOutput.push(getSemillaLog, processSemillaResponseLog, createSemillaXmlLog, signSemillaXmlLog, getTokenLog, processTokenResponseLog);
  res.send({ token, logOutput });
});

app.get('/api/delete-files', async (req, res) => {
  const logOutput = await clearOldFiles(foldersToDelete);
  res.send(logOutput);
});

app.get('/api/generate-dtes', async (req, res) => {
  const logOutput = await buildClientDte();
  res.send(logOutput);
});

app.get('/api/generate-sobre', async (req, res) => {
  const logOutput = [];
  const log1 = `Checking for unsigned files...`;
  const fileExists = await checkFileExists(unsignedBoletaDtePath + '\\dte1.xml');
  logOutput.push(log1);
  if (fileExists) {
    const log2 = 'Files found...';
    await waitForFileReady(unsignedBoletaDtePath + '\\dte1.xml');
    const log3 = 'Files ready to sign';
    const log4 = await compileAndSignSobre();

    logOutput.push(log2, log3, log4);
    res.send(logOutput);
  } else {
    const logError = `File exists: ${fileExists}`;
    logOutput.push(logError);
    res.send(logOutput);
  }
});

app.get('/api/generate-rcof', async (req, res) => {
  const logBuildRcof = await buildRcof();
  res.send(logBuildRcof);
});

app.get('/api/generate-barcodes', async (req, res) => {
  const logGenerateBarcodes = await generateBarcodes();
  res.send(logGenerateBarcodes);
});

app.get('/api/download-sobre', async (req, res) => {
  try {
    const sobreFiles = await fs.readdir(boletaSobreFolderPath);
    if (sobreFiles.length === 0) {
      res.status(404).send('No files found in the directory');
      return;
    }
    // Sort files by modification time
    const sortedFiles = await Promise.all(
      sobreFiles.map(async file => {
        const filePath = path.join(boletaSobreFolderPath, file);
        const stats = await fs.stat(filePath);
        return { file, time: stats.mtime.getTime() };
      })
    );
    sortedFiles.sort((a, b) => b.time - a.time);
    const latestSobre = sortedFiles[0].file;
    res.download(path.join(boletaSobreFolderPath, latestSobre));
  } catch (error) {
    console.error(`ERROR: Failed to download sobre: ${error}`);
    res.status(500).send(`Error downloading the file: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

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

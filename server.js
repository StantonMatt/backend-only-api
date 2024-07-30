'use strict';

const cors = require('cors');
const path = require('path');
const multer = require('multer');
const archiver = require('archiver');
const XLSX = require('xlsx');
const fs = require('fs-extra');

const main = require('./app.js');
const paths = require('./paths.js');
const { buildClientDte } = require('./generate-dtes.js');
const { waitForFileReady, clearOldFiles, checkFileExists } = require('./util-file.js');
const { buildRcof } = require('./generate-rcof.js');
const { generateBarcodes } = require('./generate-timbres.js');
const { compileAndSignSobre } = require('./generate-sobre.js');
const { generatePDF } = require('./generate-pdf.js');
const { generateChart } = require('./generate-chart.js');

const pdfPath = paths.getPDFBoletaFolderPath();
const pdfFilePath = path.join(pdfPath + '/Utility-Bil.pdf');

const signedBoletaDtePath = paths.getSignedBoletaDteFolderPath();
const unsignedBoletaDtePath = paths.getUnsignedBoletaDteFolderPath();
const sobreBoletaPath = paths.getSobreBoletaFolderPath();
const timbresBoletaFolderPath = paths.getTimbresBoletaFolderPath();
const boletaSobreFolderPath = paths.getSobreBoletaFolderPath();
const barCodesBoletaFolderPath = paths.getBarCodesBoletaFolderPath();
const fechaFirmaTxtPath = paths.getFechaFirmaTxtPath();
const fechaEmisionTxtPath = paths.getFechaEmisionTxtPath();
const fechaVencimientoTxtPath = paths.getFechaVencimientoTxtPath();
const fechaDesdeTxtPath = paths.getFechaDesdeTxtPath();
const fechaHastaTxtPath = paths.getFechaHastaTxtPath();
const databaseJsonPath = paths.getDatabaseJsonPath();

const foldersToDelete = [sobreBoletaPath, signedBoletaDtePath, unsignedBoletaDtePath, timbresBoletaFolderPath, barCodesBoletaFolderPath];

const express = require('express');
const app = express();
const port = 5000;

app.use(cors());
app.use('/files', express.static('public'));
app.use(express.json());

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = req.body.sheet;
    const fechaFirma = req.body.fechaFirma;
    const fechaEmision = req.body.fechaEmision;
    const fechaVencimiento = req.body.fechaVencimiento;
    const fechaDesde = req.body.fechaDesde;
    const fechaHasta = req.body.fechaHasta;

    if (!workbook.SheetNames.includes(sheetName)) {
      return res.status(400).send('Selected sheet not found in the workbook.');
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Process the data as needed
    // For now, we'll just save it to a JSON file
    await fs.outputJSON(databaseJsonPath, jsonData, { spaces: 2 });

    await fs.outputFile(fechaFirmaTxtPath, fechaFirma);
    await fs.outputFile(fechaEmisionTxtPath, fechaEmision);
    await fs.outputFile(fechaVencimientoTxtPath, fechaVencimiento);
    await fs.outputFile(fechaDesdeTxtPath, fechaDesde);
    await fs.outputFile(fechaHastaTxtPath, fechaHasta);

    // Clean up the uploaded file
    await fs.remove(req.file.path);

    res.status(200).send({
      message: `${sheetName} sheet processed successfully `,
      sheet: sheetName,
      rowCount: jsonData.length,
    });
  } catch (error) {
    console.error('Error processing Excel file:', error);
    res.status(500).send(`Error processing file: ${error.message}`);
  }
});

app.get('/api/generate-barcodes', async (req, res) => {
  await buildClientDte();
  await compileAndSignSobre();
  const logGenerateBarcodes = await generateBarcodes();
  res.send(logGenerateBarcodes);
});

app.post('/api/process-data', async (req, res) => {
  res.json(req.body);
  await generateChart(req.body);
  await generatePDF(req.body);
});

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
  try {
    const filePath = path.join(unsignedBoletaDtePath, 'dte1.xml');
    const fileExists = await checkFileExists(filePath);

    console.log(fileExists);
    if (!fileExists) {
      logOutput.push(`File does not exist: ${filePath}`);
      return res.status(404).json({ success: false, logOutput });
    }

    await waitForFileReady(filePath);

    const signResult = await compileAndSignSobre();
    logOutput.push(`${signResult.length} sobres generated successfully:`);
    signResult.forEach(element => {
      logOutput.push(element);
    });

    res.status(200).json({ success: true, logOutput });
  } catch (error) {
    logOutput.push(`Error: ${error.message}`);
    res.status(500).json({ success: false, logOutput });
  }
});

app.get('/api/generate-rcof', async (req, res) => {
  const logBuildRcof = await buildRcof();
  res.send(logBuildRcof);
});

app.get('/api/download-sobre', async (req, res) => {
  try {
    const sobreFiles = await fs.readdir(boletaSobreFolderPath);
    if (sobreFiles.length === 0) {
      res.status(404).send('No files found in the directory');
      return;
    }

    if (sobreFiles.length === 1) {
      // If there's only one file, send it directly
      res.download(path.join(boletaSobreFolderPath, sobreFiles[0]));
    } else {
      // If there are multiple files, create a zip
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=sobre_COAB.zip',
      });

      const archive = archiver('zip', {
        zlib: { level: 9 }, // Sets the compression level
      });

      archive.on('error', function (err) {
        res.status(500).send({ error: err.message });
      });

      // pipe archive data to the response
      archive.pipe(res);

      for (const file of sobreFiles) {
        const filePath = path.join(boletaSobreFolderPath, file);
        archive.file(filePath, { name: file });
      }

      await archive.finalize();
    }
  } catch (error) {
    console.error(`ERROR: Failed to download sobre: ${error}`);
    res.status(500).send(`Error downloading the file(s): ${error.message}`);
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

'use strict';

const paths = require('./paths.js');
const { buildClientDte } = require('./generate-dtes.js');
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

//////////////////////////////////////////
/////////////API ENDPOINTS////////////////
const baseUrl = 'https://apicert.sii.cl/recursos/v1';
const baseBoletaUrl = 'https://pangal.sii.cl/recursos/v1';
const semillaUrl = '/boleta.electronica.semilla';
const tokenUrl = '/boleta.electronica.token';
const envioUrl = '/boleta.electronica.envio';
//////////////////////////////////////////
//////////////////////////////////////////
let token;
let trackid;

// (async function run() {
//   try {
//     await clearOldFiles(foldersToDelete);
//     const semillaData = await getSemilla();
//     const semilla = await processSemillaResponse(semillaData);
//     const semillaXml = await createSemillaXml(semilla);
//     const signedSemillaXml = await signSemillaXml(semillaXml);
//     const tokenData = await getToken(signedSemillaXml);
//     await processTokenResponse(tokenData);
//     await generateDteXmls();
//     await waitForFileReady(unsignedBoletaDtePath + '\\dte1.xml'); // Ensure the file is ready before proceeding
//     await compileAndSignSobre();
//     await buildRcof();
//     await generateBarcodes();
//     // await postSignedSobreXml();
//     // await getStatus();
//   } catch (error) {
//     console.error(`An error occurred: ${error.message}`);
//     // Handle the error appropriately, perhaps by retrying or aborting the process
//   }
// })();

async function getSemilla() {
  try {
    const response = await axios.get(`${baseUrl}${semillaUrl}`);
    const semillaData = response.data;
    const getSemillaLog = `Semilla request success...`;
    console.log(getSemillaLog);
    return { semillaData, getSemillaLog };
  } catch (error) {
    console.log(`Error fetching seed: ${error}`);
    throw error;
  }
}

async function processSemillaResponse(semillaData) {
  try {
    const semillaObject = convert(semillaData, { format: 'object' });
    const semilla = semillaObject['SII:RESPUESTA']['SII:RESP_BODY'].SEMILLA;
    const processSemillaResponseLog = `Semilla value extracted: ${semilla}`;
    console.log(processSemillaResponseLog);
    return { semilla, processSemillaResponseLog };
  } catch (error) {
    console.error('Error processing semilla response:', error);
  }
}

async function createSemillaXml(semilla) {
  try {
    const semillaDoc = create({ version: '1.0', encoding: 'UTF-8' }).ele('getToken').ele('item').ele('Semilla').txt(semilla);
    const semillaXml = semillaDoc.end();
    const createSemillaXmlLog = 'Creating semillaXml...';
    console.log(createSemillaXmlLog);
    return { semillaXml, createSemillaXmlLog };
  } catch (error) {
    console.log(`ERROR: Creating XML: ${error}`);
  }
}

async function signSemillaXml(semillaXml) {
  try {
    const signedSemillaXml = await signXml(semillaXml, 'item', `http://www.w3.org/2000/09/xmldsig#enveloped-signature`);
    const signSemillaXmlLog = `Semilla signing success...`;
    console.log(signSemillaXmlLog);
    await fs.writeFile(signedSemillaXmlPath, signedSemillaXml);
    return { signedSemillaXml, signSemillaXmlLog };
  } catch (error) {
    console.error(`Semilla signing failed: ${error}`);
  }
}

async function getToken(signedSemillaXml) {
  try {
    const response = await axios.post(`${baseUrl}${tokenUrl}`, signedSemillaXml, {
      headers: { 'Content-Type': 'application/xml' },
    });
    const tokenData = response.data;
    const getTokenLog = 'Token request success...';
    console.log(getTokenLog);
    return { tokenData, getTokenLog };
  } catch (error) {
    const getTokenLog = `ERROR: getToken() failed: ${error.response}`;
    console.log(getTokenLog);
  }
}

async function processTokenResponse(tokenData) {
  try {
    const tokenObject = convert(tokenData, { format: 'object' });
    token = tokenObject['SII:RESPUESTA']['SII:RESP_BODY'].TOKEN;
    const processTokenResponseLog = `Token value extracted: ${token}`;
    console.log(processTokenResponseLog);
    return { token, processTokenResponseLog };
  } catch (error) {
    console.error('Error processing token response:', error);
  }
}

async function generateDteXmls() {
  try {
    await buildClientDte();
  } catch (error) {
    console.log(`Error generating DTE Files for signing: ${error}`);
  }
}

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

async function postSignedSobreXml() {
  try {
    const form = await getFormData(sobreBoletaPath + '\\envio_boleta1.xml');
    const response = await axios.post(`${baseBoletaUrl}${envioUrl}`, form, {
      headers: {
        ...form.getHeaders(),
        Cookie: `TOKEN=${token}`,
        'User-Agent': 'Mozilla/4.0 (compatible; PROG 1.0; Windows NT)',
      },
    });
    console.log(response.data);
    trackid = response.data.trackid;
    await fs.writeFile(trackidPath, String(trackid));
    await fs.writeFile(tokenPath, String(token));
  } catch (error) {
    console.error('Submission Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

async function getStatus() {
  try {
    console.log('-----------------------');
    console.log(`TOKEN: ${token}`);
    console.log(`TRACKID: ${trackid}`);
    console.log('-----------------------');
    const response = await axios.get(`${baseUrl}${envioUrl}/76681460-3-0216471848`, {
      headers: {
        Cookie: `TOKEN=${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(`Request result:\n-----------------------\n${response.data}\n-----------------------`);
  } catch (error) {
    console.log(`${JSON.stringify(error, null, 2)}`);
    console.error(`Failed request:\n${error.response ? error.response.data : error.message}\n-----------------------\n`);
  }
}

module.exports = { getSemilla, processSemillaResponse, createSemillaXml, signSemillaXml, getToken, processTokenResponse };

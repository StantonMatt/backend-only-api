console.clear();
const { buildClientDte } = require('./make-envio.js');
const { signXml } = require('./xml-signer.js');
const { extractPrivateKey, extractPublicCertificate } = require('./extract-keys.js');
const { getFormattedTimeStamp } = require('./util.js');
const { buildClientDte2 } = require('./boleta-pruebas.js');

const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);
const fs = require('fs-extra');
const axios = require('axios');
const { convert } = require('xmlbuilder2');
const path = require('path');

const signedSemillaPath = path.join(__dirname, 'temp', 'output', 'signed_semilla.xml');
const trackidPath = path.join(__dirname, 'assets', 'tracking', `trackid${getFormattedTimeStamp()}.txt`);
const tokenPath = path.join(__dirname, 'assets', 'tracking', `token${getFormattedTimeStamp()}.txt`);

const dte39FolderPath = path.join(__dirname, 'assets', 'dtes', '39');

const dllPath = 'C:\\Users\\Matthew\\OneDrive\\Programming\\MakeEnvio\\bin\\Debug\\net6.0\\MakeEnvio.dll';

let publicCert;
let privateKey;

//////////////////////////////////////////
/////////////API ENDPOINTS////////////////
const getUrl = 'https://apicert.sii.cl/recursos/v1';
const postUrl = 'https://pangal.sii.cl/recursos/v1';
const semillaUrl = '/boleta.electronica.semilla';
const tokenUrl = '/boleta.electronica.token';
const envioUrl = '/boleta.electronica.envio';
//////////////////////////////////////////
//////////////////////////////////////////
let token;
let trackid = 22494754;

(async function run() {
  try {
    await clearOldFiles();
    await extractAndSaveKeys();
    // const semillaData = await getSemilla();
    // const semillaXml = await processSemillaResponse(semillaData);
    // const semillaSigData = await getSigData(semillaXml, 'Semilla');
    // const signedSemilla = await signSemillaXml(semillaSigData);
    // const tokenData = await getToken(signedSemilla);
    // await processTokenResponse(tokenData);
    await generateDteXmls();

    // // Assuming generateDteXmls creates files that getSignedSobreXml depends on

    await waitForFileReady(path.join(__dirname, 'assets', 'dtes', '39', 'dte0.xml')); // Ensure the file is ready before proceeding
    // await waitForFileReady(path.join(__dirname, 'assets', 'dtes', '39', 'dte1.xml')); // Ensure the file is ready before proceeding
    // await waitForFileReady(path.join(__dirname, 'assets', 'dtes', '39', 'dte2.xml')); // Ensure the file is ready before proceeding
    // await waitForFileReady(path.join(__dirname, 'assets', 'dtes', '39', 'dte3.xml')); // Ensure the file is ready before proceeding
    // await waitForFileReady(path.join(__dirname, 'assets', 'dtes', '39', 'dte4.xml')); // Ensure the file is ready before proceeding
    await getSignedSobreXml();
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    // Handle the error appropriately, perhaps by retrying or aborting the process
  }
})();

async function waitForFileReady(filePath, timeout = 30000) {
  const start = Date.now();
  let size = null;

  while (Date.now() - start < timeout) {
    try {
      const stats = await fs.stat(filePath);
      if (size === null) {
        size = stats.size;
      } else if (size === stats.size) {
        console.log('File size stable, assuming readiness');
        return true; // File size stable, assume readiness
      } else {
        size = stats.size; // Update size for next check
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error; // Rethrow errors other than file not existing
    }
    console.log('File size unstable, trying again');
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
      console.log('Deleted file:', filePath);
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

async function clearOldFiles() {
  try {
    const files = await fs.readdir(dte39FolderPath);
    for (const file of files) {
      const filePath = path.join(dte39FolderPath, file);
      await tryDelete(filePath);
    }
  } catch (error) {
    console.log(`Error deleting files: ${error}`);
  }
}

async function extractAndSaveKeys() {
  try {
    publicCert = await extractPublicCertificate();
    privateKey = await extractPrivateKey();
  } catch (error) {
    console.log(`Error extracting and saving keys: ${error}`);
  }
}

async function getSigData(xml, xpath) {
  return {
    xml,
    privateKey,
    publicCert,
    canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
    references: {
      xpath: `//*[local-name(.)='${xpath}']`,
      digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
      transforms: ['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
    },
  };
}

async function getSemilla() {
  try {
    const response = await axios.get(`${getUrl}${semillaUrl}`);
    console.log(`Semilla request success...`);
    return response.data;
  } catch (error) {
    console.log(`Error fetching seed: ${error}`);
    throw error;
  }
}

async function processSemillaResponse(semillaData) {
  try {
    const semillaObject = convert(semillaData, { format: 'object' });
    const semilla = semillaObject['SII:RESPUESTA']['SII:RESP_BODY'].SEMILLA;
    console.log(`Semilla value extracted: ${semilla}`);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<getToken><item><Semilla>${semilla}</Semilla></item></getToken>`;
  } catch (error) {
    console.error('Error processing semilla response:', error);
  }
}

async function signSemillaXml(semillaSigData) {
  try {
    const signedSemilla = await signXml(semillaSigData);

    console.error(`Semilla signing success...`);
    return signedSemilla;
  } catch (error) {
    console.error(`Semilla signing failed: ${error}`);
  }
}

async function getToken(signedSemilla) {
  try {
    const response = await axios.post(`${getUrl}${tokenUrl}`, signedSemilla, {
      headers: { 'Content-Type': 'application/xml' },
    });
    console.log('Token request success...');
    return response.data;
  } catch (error) {
    console.log('Token post request failed:', error);
  }
}

async function processTokenResponse(tokenData) {
  try {
    const tokenObject = convert(tokenData, { format: 'object' });
    token = tokenObject['SII:RESPUESTA']['SII:RESP_BODY'].TOKEN;
    console.log(`Token value extracted: ${token}`);
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

async function getSignedSobreXml() {
  try {
    const { stdout, stderr } = await execAsync(`dotnet ${dllPath}`);
    console.log('STDOUT:', stdout);
    if (stderr) {
      console.error('STDERR:', stderr);
    }
  } catch (error) {
    console.log(`Error running C# .dll to sign DTE's: ${error}`);
  }
}

async function postSignedXml() {
  try {
    const form = await buildClientDte();

    const response = await axios.post(`${postUrl}${envioUrl}`, form, {
      headers: {
        ...form.getHeaders(),
        Cookie: `TOKEN=${token}`,
        'User-Agent': 'Mozilla/4.0 (compatible; PROG 1.0; Windows NT)',
      },
    });
    console.log(response.data);
    trackid = response.data.trackid;
  } catch (error) {
    console.error('Submission Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

async function postSignedXml2() {
  try {
    const form = await buildClientDte2();

    const response = await axios.post(`${postUrl}${envioUrl}`, form, {
      headers: {
        ...form.getHeaders(),
        Cookie: `TOKEN=${token}`,
        'User-Agent': 'Mozilla/4.0 (compatible; PROG 1.0; Windows NT)',
      },
    });
    console.log(await response.data);
    trackid = String(await response.data.trackid);
    await fs.writeFile(trackidPath, trackid);
    await fs.writeFile(tokenPath, token);
  } catch (error) {
    console.error('Submission Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

// postSignedXml2();

async function getStatus() {
  try {
    // await processTokenResponse();
    console.log('-----------------------');
    console.log(`TOKEN: ${token}`);
    console.log(`TRACKID: ${trackid}`);
    console.log('-----------------------');
    const response = await axios.get(`${getUrl}${envioUrl}/76607412-K-${trackid}`, {
      headers: {
        Cookie: `TOKEN=${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(`Request result:\n-----------------------\n${response.data}\n-----------------------`);
  } catch (error) {
    console.error(`Failed request:\n${error.response ? error.response.data : error.message}\n-----------------------\n`);
  }
}

async function getStatus2() {
  try {
    console.log('-----------------------');
    console.log(`TOKEN: DQQ84HE70F5L7`);
    console.log(`TRACKID: 22495462`);
    console.log('-----------------------');
    const response = await axios.get(`${getUrl}${envioUrl}/76681460-3-215295046`, {
      headers: {
        Cookie: `TOKEN=${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(`Request result:\n-----------------------\n${response.data}\n-----------------------`);
  } catch (error) {
    console.error(`Failed request:\n${error.response ? error.response.data : error.message}\n-----------------------\n`);
  }
}

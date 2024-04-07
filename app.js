console.clear();
const { buildClientDte } = require('./make-envio.js');
const { signXml } = require('./xml-signer.js');
const { extractPrivateKey, extractPublicCertificate, extractModulus, extractExponent } = require('./extract-keys.js');
const { buildClientDte2 } = require('./boleta-pruebas.js');
const { waitForFileReady, clearOldFiles } = require('./file-util.js');
const paths = require('./paths.js');

const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);
const fs = require('fs-extra');
const axios = require('axios');
const { convert } = require('xmlbuilder2');

const signedSemillaPath = paths.getSignedSemillaPath();
const trackidPath = paths.getTrackidPath();
const tokenPath = paths.getTokenPath();
const signedBoletaDtePath = paths.getSignedBoletaDtePath();
const unsignedBoletaDtePath = paths.getUnsignedBoletaDtePath();
const sobreBoletaPath = paths.getSobreBoletaPath();
const dllPath = paths.getDllPath();

let publicCert;
let privateKey;
let modulus;
let exponent;

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
let trackid;

(async function run() {
  try {
    await clearOldFiles(sobreBoletaPath);
    await clearOldFiles(signedBoletaDtePath);
    await clearOldFiles(unsignedBoletaDtePath);
    await extractAndSaveKeys();
    // const semillaData = await getSemilla();
    // const semillaXml = await processSemillaResponse(semillaData);
    // const signedSemilla = await signSemillaXml(semillaXml);
    // const tokenData = await getToken(signedSemilla);
    // await processTokenResponse(tokenData);
    await generateDteXmls();
    // // Assuming generateDteXmls creates files that compileAndSignSobre depends on

    await waitForFileReady(unsignedBoletaDtePath + '\\dte1.xml'); // Ensure the file is ready before proceeding
    await compileAndSignSobre();
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    // Handle the error appropriately, perhaps by retrying or aborting the process
  }
})();

async function extractAndSaveKeys() {
  try {
    publicCert = await extractPublicCertificate();
    privateKey = await extractPrivateKey();
    modulus = await extractModulus();
    exponent = await extractExponent();
  } catch (error) {
    console.log(`Error extracting and saving keys: ${error}`);
  }
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

async function signSemillaXml(semillaXml) {
  try {
    const signedSemilla = await signXml(semillaXml, 'Semilla', privateKey, publicCert, modulus, exponent);

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

async function compileAndSignSobre() {
  try {
    const { stdout, stderr } = await execAsync(`dotnet ${dllPath}`);
    console.log('STDOUT:\n', stdout);
    if (stderr) {
      console.error('STDERR:', stderr);
    }
  } catch (error) {
    console.log(`Error running C# .dll to sign DTE's: ${error}`);
  }
}

async function postSignedSobreXml() {
  try {
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

async function postSignedSobreXml2() {
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

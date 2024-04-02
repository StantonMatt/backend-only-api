console.clear();
const { buildClientDte } = require('./xml-builder.js');
const { signXml } = require('./xml-signer.js');
const { extractPrivateKey, extractPublicCertificate } = require('./extract-keys.js');
const { getFormattedTimeStamp } = require('./util.js');
const { buildClientDte2 } = require('./boleta-pruebas.js');

const fs = require('fs-extra');
const axios = require('axios');
const { convert } = require('xmlbuilder2');
const path = require('path');

const signedSemillaPath = path.join(__dirname, 'temp', 'output', 'signed_semilla.xml');
const privateKeyPath = path.join(__dirname, 'temp', 'output', 'private_key.pem');
const publicCertPath = path.join(__dirname, 'temp', 'output', 'certificate.pem');
const trackidPath = path.join(__dirname, 'agricola-la-frontera', `trackid${getFormattedTimeStamp()}.txt`);
const tokenPath = path.join(__dirname, 'agricola-la-frontera', `token${getFormattedTimeStamp()}.txt`);

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
(async function extractAndSaveKeys() {
  publicCert = await extractPublicCertificate();
  privateKey = await extractPrivateKey();
})();

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

async function processSemillaResponse() {
  try {
    const semillaData = await getSemilla();
    const semillaObject = convert(semillaData, { format: 'object' });
    const semilla = semillaObject['SII:RESPUESTA']['SII:RESP_BODY'].SEMILLA;
    console.log(`Semilla value extracted: ${semilla}`);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<getToken><item><Semilla>${semilla}</Semilla></item></getToken>`;
  } catch (error) {
    console.error('Error processing semilla response:', error);
  }
}

async function signSemillaXml() {
  try {
    const semillaString = await processSemillaResponse();

    const signedSemilla = await signXml('getToken', semillaString, privateKey, publicCert);

    console.error(`Semilla signing success...`);
    return signedSemilla;
  } catch (error) {
    console.error(`Semilla signing failed: ${error}`);
  }
}

async function getToken() {
  try {
    const signedSemilla = await signSemillaXml();
    const response = await axios.post(`${getUrl}${tokenUrl}`, signedSemilla, {
      headers: { 'Content-Type': 'application/xml' },
    });
    console.log('Token request success...');
    return response.data;
  } catch (error) {
    console.log('Token post request failed:', error);
  }
}

async function processTokenResponse() {
  try {
    const tokenData = await getToken();
    const tokenObject = convert(tokenData, { format: 'object' });
    token = tokenObject['SII:RESPUESTA']['SII:RESP_BODY'].TOKEN;
    console.log(`Token value extracted: ${token}`);
  } catch (error) {
    console.error('Error processing token response:', error);
  }
}

async function postBoletas() {
  try {
    await processTokenResponse();
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

async function postBoletas2() {
  try {
    await processTokenResponse();
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

// postBoletas2();

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
    await processTokenResponse();
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

getStatus2();

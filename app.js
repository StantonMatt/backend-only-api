console.clear();
const { buildClientDte } = require('./xml-builder.js');
const { signXml } = require('./xml-signer.js');
const { extractPrivateKey, extractPublicCertificate } = require('./extract-keys.js');
const FormData = require('form-data');

const fs = require('fs-extra');
const axios = require('axios');
const { convert, create } = require('xmlbuilder2');
const xml2js = require('xml2js');
const path = require('path');

const signedSemillaPath = path.join(__dirname, 'temp', 'output', 'signed_semilla.xml');
const privateKeyPath = path.join(__dirname, 'temp', 'output', 'private_key.pem');
const publicCertPath = path.join(__dirname, 'temp', 'output', 'certificate.pem');

const parser = new xml2js.Parser();

//////////////////////////////////////////
/////////////API ENDPOINTS////////////////
const baseUrl = 'https://apicert.sii.cl/recursos/v1';
const baseUrl2 = 'https://pangal.sii.cl/recursos/v1';
const semillaUrl = '/boleta.electronica.semilla';
const tokenUrl = '/boleta.electronica.token';
const envioUrl = '/boleta.electronica.envio';
//////////////////////////////////////////
//////////////////////////////////////////
const semObj = {};
const tokObj = {};

async function getSemilla() {
  try {
    const response = await axios.get(`${baseUrl}${semillaUrl}`);
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
    return `<?xml version="1.0" encoding="UTF-8"?>\n<getToken><item><Semilla>${semilla}</Semilla></item></getToken>`; // Create XML String
  } catch (error) {
    console.error('Error processing semilla response:', error);
  }
}
// processSemillaResponse();

async function signSemillaXml() {
  try {
    const semillaString = await processSemillaResponse();

    const publicCert = await extractPublicCertificate();
    const privateKey = await extractPrivateKey();

    const signedSemilla = await signXml('getToken', semillaString, privateKey, publicCert);

    console.error(`Semilla signing success...`);
    return signedSemilla;
    await fs.writeFile(signedSemillaPath, signedSemilla); // Save signed xml
  } catch (error) {
    console.error(`Semilla signing failed: ${error}`);
  }
}

async function getToken() {
  try {
    const signedSemilla = await signSemillaXml();
    const response = await axios.post(`${baseUrl}${tokenUrl}`, signedSemilla, {
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
    const token = tokenObject['SII:RESPUESTA']['SII:RESP_BODY'].TOKEN;
    console.log(`Token value extracted: ${token}`);
    return token;
  } catch (error) {
    console.error('Error processing token response:', error);
  }
}

async function postBoletas() {
  try {
    const token = await processTokenResponse();
    const form = await buildClientDte();

    const response = await axios.post(`${baseUrl2}${envioUrl}`, form, {
      headers: {
        ...form.getHeaders(),
        Cookie: `TOKEN=${token}`,
        'User-Agent': 'Mozilla/4.0 (compatible; PROG 1.0; Windows NT)',
      },
    });
    console.log(response.data);
  } catch (error) {
    console.error('Submission Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

// postBoletas();

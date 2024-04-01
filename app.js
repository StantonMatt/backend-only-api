console.clear();
const { buildClientDte } = require('./xml-builder.js');
const { signXml } = require('./xml-signer.js');
const { extractPrivateKey, extractPublicCertificate } = require('./extract-keys.js');

const fs = require('fs-extra');
const axios = require('axios');
const { create } = require('xmlbuilder2');
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
    semObj.data = await getSemilla();
    semObj.fetchedXmlDoc = await parser.parseStringPromise(semObj.data); // Parse String -> JSON
    semObj.xmlVersion = semObj.data.slice(0, semObj.data.indexOf('>') + 1); // Get String of XML version
    semObj.semilla = semObj.fetchedXmlDoc['SII:RESPUESTA']['SII:RESP_BODY'][0].SEMILLA[0]; // Get Semilla Value
    semObj.estado = semObj.fetchedXmlDoc['SII:RESPUESTA']['SII:RESP_HDR'][0].ESTADO[0]; // Get Estado
    semObj.xmlString = `${semObj.xmlVersion}\n<getToken><item><Semilla>${semObj.semilla}</Semilla></item></getToken>`; // Create XML String

    console.log(`Semilla value extracted: ${semObj.semilla}`);
  } catch (error) {
    console.error('Error processing semilla response:', error);
  }
}

async function signSemillaXml() {
  try {
    await processSemillaResponse();
    await extractPrivateKey();
    await extractPublicCertificate();
    const publicCert = await fs.readFile(publicCertPath, 'utf8');
    const privateKey = await fs.readFile(privateKeyPath, 'utf8');

    const signedSemillaXml = await signXml('getToken', semObj.xmlString, privateKey, publicCert);

    await fs.writeFile(signedSemillaPath, signedSemillaXml); // Save signed xml
    console.error(`Semilla signing success...`);
    return signedSemillaXml;
  } catch (error) {
    console.error(`Semilla signing failed: ${error}`);
  }
}

async function getToken() {
  try {
    const signedSemillaXml = await signSemillaXml();
    const response = await axios.post(`${baseUrl}${tokenUrl}`, signedSemillaXml, {
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
    tokObj.data = await getToken();
    tokObj.fetchedXmlDoc = await parser.parseStringPromise(tokObj.data); // Parse String -> JSON
    tokObj.xmlVersion = tokObj.data.slice(0, tokObj.data.indexOf('>') + 1); // Get String of XML version
    tokObj.token = tokObj.fetchedXmlDoc['SII:RESPUESTA']['SII:RESP_BODY'][0].TOKEN[0]; // Get Semilla Value
    tokObj.estado = tokObj.fetchedXmlDoc['SII:RESPUESTA']['SII:RESP_HDR'][0].ESTADO[0]; // Get Estado
    tokObj.xmlString = `${tokObj.xmlVersion}\n<getToken><item><Semilla>${tokObj.semilla}</Semilla></item></getToken>`; // Create XML String

    console.log(`Token value extracted: ${tokObj.token}`);
  } catch (error) {
    console.error('Error processing token response:', error);
  }
}

async function postBoletas() {
  try {
    await processTokenResponse();
    const boletaForm = await buildClientDte();
    const response = await axios.post(`${baseUrl2}${envioUrl}`, boletaForm, {
      headers: {
        ...boletaForm.getHeaders(),
        Cookie: `TOKEN=${tokObj}`,
        'User-Agent': 'Mozilla/4.0 (compatible; PROG 1.0; Windows NT)',
      },
    });
    console.log('---------------------------');
    console.log('---------------------------');
    console.log('Submission Successful:\n', response.data);
    console.log('Headers:\n', response.headers);
  } catch (error) {
    console.log(error);
    console.error('Submission Error:', error.response ? error.response.data : error.message);
  }
}

postBoletas();

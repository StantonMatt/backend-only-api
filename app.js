console.clear();
const { runServer } = require('./server.js');
const {
  extractPrivateKey,
  extractCertificate,
  getFormattedCertificate,
} = require('./extract-keys.js');

const { promises: fsPromises } = require('fs');
const { SignedXml } = require('xml-crypto');
const xmlFormatter = require('xml-formatter');
const axios = require('axios');
const xml2js = require('xml2js');
const xmldom = require('xmldom');
const path = require('path');
const { response } = require('express');
const { error } = require('console');

const semillaXmlPath = path.join(__dirname, 'temp', 'output', 'semilla.xml');
const privateKeyPath = path.join(__dirname, 'temp', 'output', 'private_key.pem');
const publicCertPath = path.join(__dirname, 'temp', 'output', 'certificate.pem');
const pfxPath = path.join(__dirname, 'assets', 'certificado.pfx');
const signedSemillaPath = path.join(__dirname, 'temp', 'output', 'signed_semilla.xml');

const parser = new xml2js.Parser();
const xmlDomParser = new xmldom.DOMParser();
const xmlDomSerializer = new xmldom.XMLSerializer();

//////////////////////////////////////////
/////////////API ENDPOINTS////////////////
const baseUrl = 'https://apicert.sii.cl/recursos/v1';
const semillaUrl = '/boleta.electronica.semilla';
const tokenUrl = '/boleta.electronica.token';
//////////////////////////////////////////
//////////////////////////////////////////

const dataObject = {};

async function fetchAndParseData() {
  try {
    const response = await axios.get(`${baseUrl}${semillaUrl}`);

    dataObject.data = response.data;
    dataObject.fetchedXmlDoc = await parser.parseStringPromise(dataObject.data);
    dataObject.xmlVersion = dataObject.data.slice(0, dataObject.data.indexOf('>') + 1);
    return dataObject.fetchedXmlDoc;
  } catch (error) {
    console.log(`Error fetching seed: ${error}`);
    throw error;
  }
}

async function processResponse() {
  try {
    const fetchedXmlDoc = await fetchAndParseData();

    dataObject.semilla = fetchedXmlDoc['SII:RESPUESTA']['SII:RESP_BODY'][0].SEMILLA[0];
    dataObject.estado = fetchedXmlDoc['SII:RESPUESTA']['SII:RESP_HDR'][0].ESTADO[0];
    dataObject.xmlString = `${dataObject.xmlVersion}\n<getToken><item><Semilla>${dataObject.semilla}</Semilla></item></getToken>`;

    // Use fsPromises.writeFile to await the file write operation
    await fsPromises.writeFile(semillaXmlPath, dataObject.xmlString.trim());
    console.log('XML file has been saved successfully.');
  } catch (error) {
    console.error('Error processing response:', error);
  }
}

async function signXml() {
  try {
    await processResponse();
    await extractPrivateKey();
    await extractCertificate();
    const publicCert = await fsPromises.readFile(publicCertPath, 'utf8');
    const privateKey = await fsPromises.readFile(privateKeyPath, 'utf8');
    // const formattedXml = await xmlFormatter(dataObject.xmlString);

    var sig = new SignedXml({ privateKey: privateKey, publicCert: publicCert });
    sig.addReference({
      xpath: `//*[local-name(.)='getToken']`,
      digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
      transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature'],
    });
    sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
    sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
    sig.computeSignature(dataObject.xmlString);
    const signedDocument = sig.getSignedXml();
    await fsPromises.writeFile(signedSemillaPath, signedDocument);

    return signedDocument;
  } catch (error) {
    console.error(`Certificate signing failed: ${error}`);
  }
}

async function getToken() {
  try {
    const signedDocument = await signXml();
    console.log(dataObject);
    const tokenResponse = await axios.post(`${baseUrl}${tokenUrl}`, signedDocument, {
      headers: { 'Content-Type': 'application/xml' },
    });
    console.log('Response', tokenResponse.data);
    dataObject.tokenResponse = tokenResponse.data;
    runServer(dataObject);
  } catch (error) {
    console.log('Token post request failed:', error);
  }
}

getToken();

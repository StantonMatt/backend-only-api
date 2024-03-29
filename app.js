console.clear();
const { runServer } = require('./server.js');
const { extractPrivateKey, extractPublicCertificate } = require('./extract-keys.js');
const { SignXml, signXml } = require('./xml-signer.js');

const { promises: fsPromises } = require('fs');
const { SignedXml } = require('xml-crypto');
const xmlFormatter = require('xml-formatter');
const axios = require('axios');
const xml2js = require('xml2js');
const path = require('path');

const semillaXmlPath = path.join(__dirname, 'temp', 'output', 'semilla.xml');
const signedSemillaPath = path.join(__dirname, 'temp', 'output', 'signed_semilla.xml');
const privateKeyPath = path.join(__dirname, 'temp', 'output', 'private_key.pem');
const publicCertPath = path.join(__dirname, 'temp', 'output', 'certificate.pem');

const parser = new xml2js.Parser();

//////////////////////////////////////////
/////////////API ENDPOINTS////////////////
const baseUrl = 'https://apicert.sii.cl/recursos/v1';
const semillaUrl = '/boleta.electronica.semilla';
const tokenUrl = '/boleta.electronica.token';
//////////////////////////////////////////
//////////////////////////////////////////
const sigData = {};
const semObj = {};
const tokObj = {};

// function populateSignatureData(privateKey, publicCert) {
//   Object.assign(sigData, {
//     privateKey,
//     publicCert,
//     canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
//     signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
//     references: {
//       xpath: `//*[local-name(.)='getToken']`,
//       digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
//       transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature'],
//     },
//   });
// }

async function getSemilla() {
  try {
    const response = await axios.get(`${baseUrl}${semillaUrl}`);
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

    console.log(`Semilla extracted: ${semObj.semilla}`);

    await fsPromises.writeFile(semillaXmlPath, semObj.xmlString.trim()); // Write XML file
    console.log(`semilla.xml has been saved successfully.`);
  } catch (error) {
    console.error('Error processing semilla response:', error);
  }
}

async function signSemillaXml() {
  try {
    await processSemillaResponse();
    await extractPrivateKey();
    await extractPublicCertificate();
    const publicCert = await fsPromises.readFile(publicCertPath, 'utf8');
    const privateKey = await fsPromises.readFile(privateKeyPath, 'utf8');

    const signedSemillaXml = await signXml(
      privateKey,
      publicCert,
      'getToken',
      semObj.xmlString
    );

    // populateSignatureData(privateKey, publicCert); // Add all data for signing to sigData Object
    // // Assign Algorithms and Values for signing
    // const sig = new SignedXml(sigData);
    // sig.addReference(sigData.references);
    // sig.computeSignature(semObj.xmlString);

    // const signedSemillaXml = sig.getSignedXml(); // Get signed xml
    await fsPromises.writeFile(signedSemillaPath, signedSemillaXml); // Save signed xml

    return signedSemillaXml;
  } catch (error) {
    console.error(`Certificate signing failed: ${error}`);
  }
}

async function getToken() {
  try {
    const signedSemillaXml = await signSemillaXml();
    const response = await axios.post(`${baseUrl}${tokenUrl}`, signedSemillaXml, {
      headers: { 'Content-Type': 'application/xml' },
    });
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

    console.log(`Token extracted: ${tokObj.token}`);

    // await fsPromises.writeFile(semillaXmlPath, tokObj.xmlString.trim()); // Write XML file
    // console.log(`semilla.xml has been saved successfully.`);
    runServer(semObj, tokObj);
  } catch (error) {
    console.error('Error processing token response:', error);
  }
}

processTokenResponse();

console.clear();
const { runServer } = require('./server.js');
const { getKey } = require('./extract-key.js');

const { promises: fsPromises } = require('fs');
const axios = require('axios');
const xml2js = require('xml2js');
const xmldom = require('xmldom');
const path = require('path');

const filePath = path.join(__dirname, 'temp', 'output', 'semilla.xml');

const parser = new xml2js.Parser();
const xmlDomParser = new xmldom.DOMParser();
const xmlDomSerializer = new xmldom.XMLSerializer();

//////////////////////////////////////////
/////////////API ENDPOINTS////////////////
const baseUrl = 'https://apicert.sii.cl/recursos/v1';
const semillaPath = '/boleta.electronica.semilla';
const tokenPath = '/boleta.electronica.token';
//////////////////////////////////////////
//////////////////////////////////////////

const dataObject = {};

getKey();
async function fetchAndParseData() {
  try {
    const response = await axios.get(`${baseUrl}${semillaPath}`);

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

    // Use fs.promises.writeFile to await the file write operation
    await fsPromises.writeFile(filePath, dataObject.xmlString.trim());
    console.log('XML file has been saved successfully.');

    runServer(dataObject);
  } catch (error) {
    console.error('Error processing response:', error);
  }
}

processResponse();

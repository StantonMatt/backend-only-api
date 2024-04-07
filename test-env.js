const { fragment, convert, create } = require('xmlbuilder2');
const { SignedXml } = require('xml-crypto');
const { chilkatExample } = require('./chilkat.js');
const path = require('path');
const fs = require('fs-extra');
const { env } = require('process');

const privateKeyPath = path.join(__dirname, 'temp', 'output', 'private_key.pem');
const publicCertPath = path.join(__dirname, 'temp', 'output', 'certificate.pem');
const signedSobreXmlPath = path.join(__dirname, 'signedSobreXml.xml');

async function sign(xml, privateKey, publicCert, xpath) {
  try {
    var sig = new SignedXml({ privateKey, publicCert });

    sig.addReference({
      xpath: `//*[local-name(.)='${xpath}']`,
      digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
      transforms: ['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
    });
    sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
    sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
    sig.computeSignature(xml);

    return sig.getSignedXml();
  } catch (error) {
    console.log(error);
  }
}
let folio = 0;
async function createDte() {
  const dteDoc = create({ version: '1.0', encoding: 'ISO-8859-1' })
    .ele('DTE', {
      xmlns: 'http://www.sii.cl/SiiDte',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation': 'http://www.sii.cl/SiiDte DTE_v10.xsd',
      version: '1.0',
    })
    .ele('Documento')
    .ele('Encabezado')
    // Add elements defined within Encabezado according to your schema
    // For demonstration, let's add a simple child element. Replace this with actual schema definitions
    .ele('IdDoc')
    .ele('TipoDTE')
    .txt(39)
    .up()
    .ele('Folio')
    .txt(folio++)
    .up()
    .up() // Close IdDoc
    // Continue adding other elements as required by your schema
    .up() // Close Encabezado
    // Add additional elements as per your schema
    .up() // Close Documento
    .up(); // Close DTE

  // Convert the document to string with pretty print for readability
  return dteDoc.end({ prettyPrint: true });
}

async function run() {
  try {
    const privateKey = await fs.readFile(privateKeyPath, 'utf8');
    const publicCert = await fs.readFile(publicCertPath, 'utf8');

    const sobreDoc = create({ version: '1.0', encoding: 'ISO-8859-1' })
      .ele('EnvioBOLETAS', {
        xmlns: 'http://www.sii.cl/SiiDte',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation': 'http://www.sii.cl/SiiDte EnvioBOLETA_v11.xsd',
        version: '1.0',
      })
      .ele('SetDTE', { ID: 'SetDoc' });

    for (let i = 0; i < 3; i++) {
      const signedXmlPath = path.join(__dirname, `signedXml${i}.xml`);

      const dteXml = await createDte();
      const signedDteXml = await sign(dteXml, privateKey, publicCert, 'Documento');
      await fs.writeFile(signedXmlPath, signedDteXml);
      chilkatExample(signedDteXml);
      const signedDteXmlFrag = fragment(signedDteXml);
      sobreDoc.import(signedDteXmlFrag);
    }

    // Continue adding elements according to the schema definition

    // Parse the signed XML string into a document fragment

    // Import the fragment into your document

    // Convert the XML document to a string
    const sobreXml = sobreDoc.end();

    console.log(sobreXml);

    const signedSobreXml = await sign(sobreXml, privateKey, publicCert, 'SetDTE');

    await fs.writeFile(signedSobreXmlPath, signedSobreXml);

    chilkatExample(signedSobreXml);
  } catch (error) {
    console.log(error);
  }
}

run();

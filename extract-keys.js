const path = require('path');
const forge = require('node-forge');
const { promises: fsPromises } = require('fs');
const { Certificate } = require('crypto');

const privateKeyPath = path.join(__dirname, 'temp', 'output', 'private_key.pem');
const publicCertPath = path.join(__dirname, 'temp', 'output', 'certificate.pem');
const pfxPath = path.join(__dirname, 'assets', 'certificado.pfx');
const pfxPasswordPath = path.join(__dirname, 'assets', 'clave_certificado.txt');

async function extractPrivateKey() {
  try {
    const pfxFile = await fsPromises.readFile(pfxPath);
    const pfxPassword = (await fsPromises.readFile(pfxPasswordPath, 'utf8')).trim();

    const p12Asn1 = forge.asn1.fromDer(pfxFile.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, pfxPassword);

    let privateKey = null;

    for (const safeContents of p12.safeContents) {
      for (const safeBag of safeContents.safeBags) {
        if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
          privateKey = forge.pki.privateKeyToPem(safeBag.key);
          break;
        }
      }
      if (privateKey) break;
    }

    if (privateKey) {
      await fsPromises.writeFile(privateKeyPath, privateKey);
      console.log('Private key has been saved successfully.');
    } else {
      console.log('Private key not found in the .pfx file.');
    }
  } catch (error) {
    console.error('Failed to process PFX file:', error);
  }
}

async function extractCertificate() {
  try {
    const pfxPassword = (await fsPromises.readFile(pfxPasswordPath, 'utf8')).trim();
    const pfx = await fsPromises.readFile(pfxPath);

    // Directly use the Buffer from readFile without Base64 decoding
    const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(pfx.toString('binary')));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, pfxPassword);

    let certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    let certBag = certBags[forge.pki.oids.certBag][0];

    if (!certBag) {
      console.error('No certificate found in PFX file.');
      return;
    }

    let certPem = forge.pki.certificateToPem(certBag.cert);
    await fsPromises.writeFile(publicCertPath, certPem);
    console.log('Certificate extracted');
  } catch (error) {
    console.error('Failed to extract certificate from PFX:', error);
  }
}

module.exports = { extractPrivateKey, extractCertificate };

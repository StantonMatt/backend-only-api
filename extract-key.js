const path = require('path');
const forge = require('node-forge');
const { promises: fsPromises } = require('fs');

const privateKeySavePath = path.join(__dirname, 'assets', 'private_key.pem');
const pfxPath = path.join(__dirname, 'assets', 'certificado.pfx');
const pfxPasswordPath = path.join(__dirname, 'assets', 'clave_certificado.txt');

async function getKey() {
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
      await fsPromises.writeFile(privateKeySavePath, privateKey);
      console.log('Private key has been saved successfully.');
    } else {
      console.log('Private key not found in the .pfx file.');
    }
  } catch (error) {
    console.error('Failed to process PFX file:', error);
  }
}

module.exports = { getKey };

const path = require('path');
const forge = require('node-forge');
const fs = require('fs-extra');

const privateKeyPath = path.join(__dirname, 'assets', 'keys', 'private_key.pem');
const publicCertPath = path.join(__dirname, 'assets', 'keys', 'certificate.pem');
const pfxPath = path.join(__dirname, 'assets', 'certificates', 'user.pfx');
const pfxPasswordPath = path.join(__dirname, 'assets', 'keys', 'cer_pass.key');

async function extractPrivateKey() {
  try {
    const pfxFile = await fs.readFile(pfxPath);
    const pfxPassword = (await fs.readFile(pfxPasswordPath, 'utf8')).trim();

    const p12Asn1 = forge.asn1.fromDer(pfxFile.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, pfxPassword);

    let privateKey = null;

    for (const safeContents of p12.safeContents) {
      for (const safeBag of safeContents.safeBags) {
        if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
          privateKey = forge.pki.privateKeyToPem(safeBag.key);
          console.log('Private Key extracted');
          break;
        }
      }
      if (privateKey) break;
    }

    if (privateKey) {
      await fs.writeFile(privateKeyPath, privateKey);
      console.log('Private key has been saved successfully.');
      return privateKey;
    } else {
      console.log('Private key not found in the .pfx file.');
      return null;
    }
  } catch (error) {
    console.error('Failed to process PFX file:', error);
  }
}

async function extractPublicCertificate() {
  try {
    const pfxPassword = (await fs.readFile(pfxPasswordPath, 'utf8')).trim();
    const pfx = await fs.readFile(pfxPath);

    // Directly use the Buffer from readFile without Base64 decoding
    const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(pfx.toString('binary')));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, pfxPassword);

    let certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    let certBag = certBags[forge.pki.oids.certBag][0];

    if (!certBag) {
      console.error('No certificate found in PFX file.');
      return null;
    }
    console.log('Public Certificate extracted');

    let certPem = forge.pki.certificateToPem(certBag.cert);
    await fs.writeFile(publicCertPath, certPem);
    console.log('Public Certificate has been saved successfully.');
    return certPem;
  } catch (error) {
    console.error('Failed to extract Public Certificate from PFX:', error);
    return null;
  }
}

async function extractModulus() {
  try {
    const publicKey = await extractPublicKey();
    const modulusBuffer = Buffer.from(publicKey.n.toByteArray());
    return modulusBuffer.toString('base64');
  } catch (error) {
    console.log(`Error extracting Modulus: ${error}`);
  }
}

async function extractExponent() {
  try {
    const publicKey = await extractPublicKey();
    const modulusBuffer = Buffer.from(publicKey.e.toByteArray());
    return modulusBuffer.toString('base64');
  } catch (error) {
    console.log(`Error extracting Exponent: ${error}`);
  }
}

async function extractPublicKey() {
  try {
    // Load the certificate
    const certPem = await fs.readFile(publicCertPath, 'utf8');
    const certificate = forge.pki.certificateFromPem(certPem);

    // Extract the public key from the certificate
    return certificate.publicKey;
  } catch (error) {
    console.log(`Error extracting Public Key: ${error}`);
  }
}

module.exports = { extractPrivateKey, extractPublicCertificate, extractModulus, extractExponent };

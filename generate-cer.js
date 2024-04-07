const path = require('path');
const fs = require('fs-extra');
const forge = require('node-forge');

const projectRoot = path.resolve(__dirname);

const pfxPath = path.join(__dirname, 'assets', 'certificates', 'user.pfx');
const cerPath = path.join(__dirname, 'assets', 'certificates', 'user.cer');
const pfxPasswordPath = path.join(__dirname, 'assets', 'keys', 'cer_pass.key');

async function generateCer() {
  try {
    const pfxPassword = await fs.readFile(pfxPasswordPath, 'utf8');

    const pfxData = await fs.readFile(pfxPath, 'binary');

    // Parse the PFX file using node-forge
    const p12Asn1 = forge.asn1.fromDer(pfxData, false);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, pfxPassword);

    // Extract the certificate(s)
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    // This example assumes there is at least one certificate
    const cert = certBags[forge.pki.oids.certBag][0].cert;
    const pem = forge.pki.certificateToPem(cert);

    // Write the certificate to a file
    await fs.writeFile(cerPath, pem, 'utf8');

    console.log('Certificate extracted successfully:', path.relative(projectRoot, cerPath));
  } catch (error) {
    console.log(`Failed to generate certificate: ${error}`);
  }
}

module.exports = { generateCer };

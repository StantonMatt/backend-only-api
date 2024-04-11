'use strict';

const { SignedXml } = require('xml-crypto');
const keys = require('./extract-keys.js');

async function signXml(xml, signElement, transform) {
  try {
    const publicCert = await keys.extractPublicCertificate();
    const privateKey = await keys.extractPrivateKey();
    const modulus = await keys.extractModulus();
    const exponent = await keys.extractExponent();

    const sigData = getSinatureData(signElement, transform);
    const sig = new SignedXml({ privateKey, publicCert });

    const certPem = publicCert.toString().replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '').trim();
    sig.getKeyInfoContent = function () {
      return (
        `<KeyValue>` +
        `<RSAKeyValue>` +
        `<Modulus>${modulus}</Modulus>` +
        `<Exponent>${exponent}</Exponent>` +
        `</RSAKeyValue>` +
        `</KeyValue>` +
        `<X509Data>` +
        `<X509Certificate>${certPem}</X509Certificate>` +
        `</X509Data>`
      );
    };
    sig.canonicalizationAlgorithm = sigData.canonicalizationAlgorithm;
    sig.signatureAlgorithm = sigData.signatureAlgorithm;
    sig.addReference(sigData.references);
    sig.computeSignature(xml);
    return sig.getSignedXml();
  } catch (error) {
    console.log(`ERROR: Signing failed: ${error}`);
  }
}

function getSinatureData(signElement, transform) {
  try {
    return {
      canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
      signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
      references: {
        xpath: `//*[local-name(.)='${signElement}']`,
        transforms: [transform],
        digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
      },
    };
  } catch (error) {
    console.log(`ERROR: failed to get Sinature Data: ${error}`);
  }
}

module.exports = { signXml };

'use strict';

const { SignedXml } = require('xml-crypto');

async function signXml(tag, xmlString, privateKey, publicCert, modulus, exponent) {
  const sigData = getSinatureData(tag, privateKey, publicCert);
  const sig = new SignedXml(sigData);

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
  sig.addReference(sigData.references);
  sig.computeSignature(xmlString);

  return sig.getSignedXml();
}

function getSinatureData(tag, privateKey, publicCert) {
  return {
    privateKey,
    publicCert,
    canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
    references: {
      xpath: `//*[local-name(.)='${tag}']`,
      digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
      transforms: ['http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
    },
  };
}

module.exports = { signXml };

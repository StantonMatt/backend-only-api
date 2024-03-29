'use strict';

const { SignedXml } = require('xml-crypto');

async function signXml(privateKey, publicCert, tag, xmlString) {
  const sigData = getSinatureData(privateKey, publicCert, tag);
  const sig = new SignedXml(sigData);
  sig.addReference(sigData.references);
  sig.computeSignature(xmlString);

  return sig.getSignedXml();
}

function getSinatureData(privateKey, publicCert, tag) {
  return {
    privateKey,
    publicCert,
    canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
    references: {
      xpath: `//*[local-name(.)='${tag}']`,
      digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
      transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature'],
    },
  };
}

module.exports = { signXml };

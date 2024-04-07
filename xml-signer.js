'use strict';

const { SignedXml } = require('xml-crypto');

async function signXml(xml, signElement, privateKey, publicCert, modulus, exponent) {
  const sigData = getSinatureData(signElement);
  // let privateKey = sigData.privateKey;
  // let publicCert = sigData.publicCert;
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
}

function getSinatureData(signElement) {
  return {
    canonicalizationAlgorithm: 'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
    references: {
      xpath: `//*[local-name(.)='${signElement}']`,
      digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
      transforms: [`http://www.w3.org/2001/10/xml-exc-c14n#WithComments`],
    },
  };
}

module.exports = { signXml };

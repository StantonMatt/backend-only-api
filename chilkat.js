'use strict';

var os = require('os');
if (os.platform() == 'win32') {
  if (os.arch() == 'ia32') {
    var chilkat = require('@chilkat/ck-node21-win-ia32');
  } else {
    var chilkat = require('@chilkat/ck-node20-win64');
  }
} else if (os.platform() == 'linux') {
  if (os.arch() == 'arm') {
    var chilkat = require('@chilkat/ck-node21-arm');
  } else if (os.arch() == 'x86') {
    var chilkat = require('@chilkat/ck-node21-linux32');
  } else {
    var chilkat = require('@chilkat/ck-node21-linux64');
  }
} else if (os.platform() == 'darwin') {
  if (os.arch() == 'arm64') {
    var chilkat = require('@chilkat/ck-node21-mac-m1');
  } else {
    var chilkat = require('@chilkat/ck-node21-macosx');
  }
}

function chilkatExample(xml) {
  var dsig = new chilkat.XmlDSig();
  var success = dsig.LoadSignature(xml);

  var numSignatures = dsig.NumSignatures;
  var i = 0;
  while (i < numSignatures) {
    dsig.Selector = i;

    var bVerifyRefDigests = false;
    var bSignatureVerified = dsig.VerifySignature(bVerifyRefDigests);
    console.log('-----------------------------------');
    if (bSignatureVerified == true) {
      console.log('Signature ' + (i + 1) + ' VERIFIED!');
    } else {
      console.error('ERROR: SIGNATURE ' + (i + 1) + ' INVALID!');
    }

    // Check each of the reference digests separately..
    var numRefDigests = dsig.NumReferences;
    var j = 0;
    while (j < numRefDigests) {
      var bDigestVerified = dsig.VerifyReferenceDigest(j);
      let message;
      switch (dsig.RefFailReason) {
        case 0:
          message = 'SUCCESS! Digest is valid.';
          break;
        case 1:
          message = 'ERROR: The computed digest differs from the digest stored in the XML.';
          break;
        case 2:
          message = 'ERROR: An external file is referenced, but it is unavailable for computing the digest.';
          break;
        case 3:
          message = 'ERROR: The index argument passed to VerifyReferenceDigest was out of range.';
          break;
        case 4:
          message = 'ERROR: Unable to find the Signature.';
          break;
        case 5:
          message = 'ERROR: A transformation specified some sort of XML canonicalization that is not supported.';
          break;
        case 99:
          message = 'ERROR: Unknown. (Should never get this value.)';
          break;
        default:
          message = 'ERROR: Invalid result code.';
      }
      console.log('Reference digest ' + (j + 1), message);

      j = j + 1;
    }

    i = i + 1;
  }
}

module.exports = { chilkatExample };

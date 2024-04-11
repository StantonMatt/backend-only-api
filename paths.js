'use strict';

const path = require('path');
const { getFormattedTimeStamp } = require('./util-date');

const getPrivateKeyPath = function () {
  return path.join(__dirname, 'assets', 'keys', 'private_key.pem');
};
const getPublicCertPath = function () {
  return path.join(__dirname, 'assets', 'keys', 'certificate.pem');
};
const getPfxPasswordPath = function () {
  return path.join(__dirname, 'assets', 'keys', 'cer_pass.key');
};
const getPfxPath = function () {
  return path.join(__dirname, 'assets', 'certificates', 'user.pfx');
};
const getCerPath = function () {
  return path.join(__dirname, 'assets', 'certificates', 'user.cer');
};
const getSignedSemillaXmlPath = function () {
  return path.join(__dirname, 'assets', 'output', 'signed_semilla.xml');
};
const getBoletaTrackidPath = function () {
  return path.join(__dirname, 'assets', 'tracking', 'boletas', `trackid${getFormattedTimeStamp()}.txt`);
};
const getTokenPath = function () {
  return path.join(__dirname, 'assets', 'tracking', 'boletas', `token${getFormattedTimeStamp()}.txt`);
};
const responseBoletaPath = function (qtyBoletas, trackid) {
  return path.join(__dirname, 'assets', 'output', 'boletas', 'response', `${qtyBoletas}_${trackid}_${getFormattedTimeStamp()}.txt`);
};
const getSignedBoletaDtePath = function () {
  return path.join(__dirname, 'assets', 'output', 'boletas', 'dtes', 'signed');
};
const getUnsignedBoletaDtePath = function () {
  return path.join(__dirname, 'assets', 'output', 'boletas', 'dtes', 'unsigned');
};
const getSobreBoletaPath = function () {
  return path.join(__dirname, 'assets', 'output', 'boletas', 'sobres');
};
const getDllPath = function () {
  return path.join(__dirname, 'assets', 'cryptosys', 'net6.0', 'MakeEnvio.dll');
};
const getTemplateFile39Path = function () {
  return path.join(__dirname, 'assets', 'templates', 'sobre_template39.xml');
};
const getSobreFolderPath = function () {
  return path.join(__dirname, 'assets', 'output', 'boletas', 'sobres');
};
const getCofXmlPath = function () {
  return path.join(__dirname, 'assets', 'output', 'boletas', 'rcofs', 'rcofs.xml');
};
const getCafPrivateKeyPath = function () {
  return path.join(__dirname, 'assets', 'keys', 'caf39.key');
};
const getCafPath = function () {
  return path.join(__dirname, 'assets', 'CAFAGRICOLA.xml');
};
const getPrimerFolioDisponiblePath = function () {
  return path.join(__dirname, 'assets', 'read-values', 'boletas', 'primer_folio_disponible.txt');
};
const getCantidadFoliosEmitidosPath = function () {
  return path.join(__dirname, 'assets', 'read-values', 'boletas', 'cantidad_folios_emitidos.txt');
};
const getRcofDisponiblePath = function () {
  return path.join(__dirname, 'assets', 'read-values', 'boletas', 'rcof_disponible.txt');
};
const getMontoNetoBoletasPath = function () {
  return path.join(__dirname, 'assets', 'read-values', 'boletas', 'monto_neto.txt');
};
const getMontoIvaBoletasPath = function () {
  return path.join(__dirname, 'assets', 'read-values', 'boletas', 'monto_iva.txt');
};
const getMontoExentoBoletasPath = function () {
  return path.join(__dirname, 'assets', 'read-values', 'boletas', 'monto_exento.txt');
};
const getMontoTotalBoletasPath = function () {
  return path.join(__dirname, 'assets', 'read-values', 'boletas', 'monto_total.txt');
};

module.exports = {
  getPrivateKeyPath,
  getPublicCertPath,
  getPfxPasswordPath,
  getPfxPath,
  getCerPath,
  getSignedSemillaXmlPath,
  getBoletaTrackidPath,
  getTokenPath,
  getSignedBoletaDtePath,
  getUnsignedBoletaDtePath,
  getSobreBoletaPath,
  getDllPath,
  getTemplateFile39Path,
  getSobreFolderPath,
  getCofXmlPath,
  getCafPrivateKeyPath,
  getCafPath,
  getPrimerFolioDisponiblePath,
  getCantidadFoliosEmitidosPath,
  getRcofDisponiblePath,
  getMontoNetoBoletasPath,
  getMontoIvaBoletasPath,
  getMontoExentoBoletasPath,
  getMontoTotalBoletasPath,
};

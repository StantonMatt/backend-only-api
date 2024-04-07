'use strict';

const path = require('path');
const { getFormattedTimeStamp } = require('./date-util');

const getSignedSemillaPath = function () {
  return path.join(__dirname, 'temp', 'output', 'signed_semilla.xml');
};
const getTrackidPath = function () {
  return path.join(__dirname, 'assets', 'tracking', `trackid${getFormattedTimeStamp()}.txt`);
};
const getTokenPath = function () {
  return path.join(__dirname, 'assets', 'tracking', `token${getFormattedTimeStamp()}.txt`);
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

module.exports = {
  getSignedSemillaPath,
  getTrackidPath,
  getTokenPath,
  getSignedBoletaDtePath,
  getUnsignedBoletaDtePath,
  getSobreBoletaPath,
  getDllPath,
  getTemplateFile39Path,
  getSobreFolderPath,
};

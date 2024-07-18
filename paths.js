'use strict';

const path = require('path');

const getDatabaseFolderPath = () => path.join(__dirname, 'database');

const getDatabaseJsonPath = () => path.join(__dirname, 'database', 'planilla.json');

const getFechaFirmaTxtPath = () => path.join(__dirname, 'database', 'fecha_firma.txt');

const getFechaEmisionTxtPath = () => path.join(__dirname, 'database', 'fecha_emision.txt');

const getFechaVencimientoTxtPath = () => path.join(__dirname, 'database', 'fecha_vencimiento.txt');

const getPrivateKeyPath = () => path.join(__dirname, 'public', 'keys', 'private_key.pem');

const getPublicCertPath = () => path.join(__dirname, 'public', 'keys', 'certificate.pem');

const getPfxPasswordPath = () => path.join(__dirname, 'public', 'keys', 'cer_pass.key');

const getPfxPath = () => path.join(__dirname, 'public', 'certificates', 'user.pfx');

const getCerPath = () => path.join(__dirname, 'public', 'certificates', 'user.cer');

const getSignedSemillaXmlPath = () => path.join(__dirname, 'public', 'output', 'signed_semilla.xml');

const getBoletaTrackidPath = () => path.join(__dirname, 'public', 'tracking', 'boletas', `trackid${getFormattedTimeStamp()}.txt`);

const getTokenPath = () => path.join(__dirname, 'public', 'tracking', 'boletas', `token${getFormattedTimeStamp()}.txt`);

const responseBoletaPath = (qtyBoletas, trackid) =>
  path.join(__dirname, 'public', 'output', 'boletas', 'response', `${qtyBoletas}_${trackid}_${getFormattedTimeStamp()}.txt`);

const getSignedBoletaDteFolderPath = () => path.join(__dirname, 'public', 'output', 'boletas', 'dtes', 'signed');

const getUnsignedBoletaDteFolderPath = () => path.join(__dirname, 'public', 'output', 'boletas', 'dtes', 'unsigned');

const getTimbresBoletaFolderPath = () => path.join(__dirname, 'public', 'output', 'boletas', 'images', 'timbres');

const getBarCodesBoletaFolderPath = () => path.join(__dirname, 'public', 'output', 'boletas', 'images', 'barras');

const getGraphsBoletaFolderPath = () => path.join(__dirname, 'public', 'output', 'boletas', 'images', 'graphs');

const getSobreBoletaFolderPath = () => path.join(__dirname, 'public', 'output', 'boletas', 'sobres');
const getPDFBoletaFolderPath = () => path.join(__dirname, 'public', 'output', 'boletas', 'pdfs');

const getDllPath = () => path.join(__dirname, 'public', 'cryptosys', 'net6.0', 'MakeEnvio.dll');

const getTemplate39Path = () => path.join(__dirname, 'public', 'templates', 'sobre_template39.xml');

const getRcofXmlPath = () => path.join(__dirname, 'public', 'output', 'boletas', 'rcofs', 'rcofs.xml');

const getCaf39PrivateKeyPath = () => path.join(__dirname, 'public', 'keys', 'caf39.key');

const getCaf39Path = () => path.join(__dirname, 'public', 'read-values', 'boletas', 'CAFCOABPRUEBA.xml');

const getPrimerFolioDisponiblePath = () => path.join(__dirname, 'public', 'read-values', 'boletas', 'primer_folio_disponible.txt');

const getCantidadFoliosEmitidosPath = () => path.join(__dirname, 'public', 'read-values', 'boletas', 'cantidad_folios_emitidos.txt');

const getRcofDisponiblePath = () => path.join(__dirname, 'public', 'read-values', 'boletas', 'rcof_disponible.txt');

const getMontoNetoBoletasPath = () => path.join(__dirname, 'public', 'read-values', 'boletas', 'monto_neto.txt');

const getMontoIvaBoletasPath = () => path.join(__dirname, 'public', 'read-values', 'boletas', 'monto_iva.txt');

const getMontoExentoBoletasPath = () => path.join(__dirname, 'public', 'read-values', 'boletas', 'monto_exento.txt');

const getMontoTotalBoletasPath = () => path.join(__dirname, 'public', 'read-values', 'boletas', 'monto_total.txt');

module.exports = {
  getPrivateKeyPath,
  getPublicCertPath,
  getPfxPasswordPath,
  getPfxPath,
  getCerPath,
  getSignedSemillaXmlPath,
  getBoletaTrackidPath,
  getTokenPath,
  getSignedBoletaDteFolderPath,
  getUnsignedBoletaDteFolderPath,
  getTimbresBoletaFolderPath,
  getBarCodesBoletaFolderPath,
  getGraphsBoletaFolderPath,
  getSobreBoletaFolderPath,
  getPDFBoletaFolderPath,
  getDllPath,
  getTemplate39Path,
  getSobreBoletaFolderPath,
  getRcofXmlPath,
  getCaf39PrivateKeyPath,
  getCaf39Path,
  getPrimerFolioDisponiblePath,
  getCantidadFoliosEmitidosPath,
  getRcofDisponiblePath,
  getMontoNetoBoletasPath,
  getMontoIvaBoletasPath,
  getMontoExentoBoletasPath,
  getMontoTotalBoletasPath,
  getDatabaseFolderPath,
  getDatabaseJsonPath,
  getFechaFirmaTxtPath,
  getFechaEmisionTxtPath,
  getFechaVencimientoTxtPath,
};

function getFormattedTimeStamp() {
  const today = new Date();
  const date = new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(today);
  const hour = String(today.getHours()).padStart(2, 0);
  const minutes = String(today.getMinutes()).padStart(2, 0);
  const seconds = String(today.getSeconds()).padStart(2, 0);
  return `${date}T${hour}_${minutes}_${seconds}`;
}

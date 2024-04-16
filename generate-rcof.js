'use strict';

const fs = require('fs-extra');
const { create } = require('xmlbuilder2');

const { getCompanyData } = require('./database.js');
const paths = require('./paths.js');
const { getTedFormattedTimeStamp, getTodayDteFormattedDate } = require('./util-date.js');
const { signXml } = require('./signer.js');

const rcofXmlPath = paths.getRcofXmlPath();
const primerFolioDisponiblePath = paths.getPrimerFolioDisponiblePath();
const cantidadFoliosEmitidosPath = paths.getCantidadFoliosEmitidosPath();
const rcofDisponiblePath = paths.getRcofDisponiblePath();
const montoNetoBoletasPath = paths.getMontoNetoBoletasPath();
const montoIvaBoletasPath = paths.getMontoIvaBoletasPath();
const montoExentoBoletasPath = paths.getMontoExentoBoletasPath();
const montoTotalBoletasPath = paths.getMontoTotalBoletasPath();

async function buildRcof() {
  try {
    const data = await getCompanyData();
    const rutEmisor = data.rutEmisor;
    const fchResol = data.fchResol;
    const nroResol = data.nroResol;
    const rutEnvia = data.rutEnvia;
    const tipoDte = data.tipoDte;

    const secEnvio = 2;
    const fchInicio = getTodayDteFormattedDate();
    const fchFinal = getTodayDteFormattedDate();
    const mntNeto = await fs.readFile(montoNetoBoletasPath, 'utf8');
    const mntIva = await fs.readFile(montoIvaBoletasPath, 'utf8');
    const mntExento = await fs.readFile(montoExentoBoletasPath, 'utf8');
    const mntTotal = await fs.readFile(montoTotalBoletasPath, 'utf8');

    const foliosEmitidos = Number(await fs.readFile(cantidadFoliosEmitidosPath, 'utf8'));
    const foliosAnulados = 0;
    const foliosUtilizados = foliosEmitidos + foliosAnulados;
    const folioInicial = Number(await fs.readFile(primerFolioDisponiblePath, 'utf8'));
    const folioFinal = folioInicial + foliosUtilizados;

    const rcofId = (await fs.readFile(rcofDisponiblePath, 'utf8')).padStart(2, '0');
    const timeStamp = getTedFormattedTimeStamp();

    const cofDoc = create({ version: '1.0', encoding: 'ISO-8859-1' })
      .ele('ConsumoFolios', {
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation': 'http://www.sii.cl/SiiDte ConsumoFolio_v10.xsd',
        xmlns: 'http://www.sii.cl/SiiDte',
        version: '1.0',
      })
      .ele('DocumentoConsumoFolios', { ID: `RCOF_${rcofId}` })
      .ele('Caratula', { version: '1.0' })
      .ele('RutEmisor')
      .txt(rutEmisor)
      .up()
      .ele('RutEnvia')
      .txt(rutEnvia)
      .up()
      .ele('FchResol')
      .txt(fchResol)
      .up()
      .ele('NroResol')
      .txt(nroResol)
      .up()
      .ele('FchInicio')
      .txt(fchInicio)
      .up()
      .ele('FchFinal')
      .txt(fchFinal)
      .up()
      .ele('SecEnvio')
      .txt(secEnvio)
      .up()
      .ele('TmstFirmaEnv')
      .txt(timeStamp)
      .up()
      .up()
      .ele('Resumen')
      .ele('TipoDocumento')
      .txt(tipoDte)
      .up()
      .ele('MntNeto')
      .txt(mntNeto)
      .up()
      .ele('MntIva')
      .txt(mntIva)
      .up()
      .ele('MntExento')
      .txt(mntExento)
      .up()
      .ele('MntTotal')
      .txt(mntTotal)
      .up()
      .ele('FoliosEmitidos')
      .txt(foliosEmitidos)
      .up()
      .ele('FoliosAnulados')
      .txt(foliosAnulados)
      .up()
      .ele('FoliosUtilizados')
      .txt(foliosUtilizados)
      .up()
      .ele('RangoUtilizados')
      .ele('Inicial')
      .txt(folioInicial)
      .up()
      .ele('Final')
      .txt(folioFinal);

    const rcofXml = cofDoc.end({ prettyPrint: true });
    const signedRcofXml = await signXml(rcofXml, 'DocumentoConsumoFolios', `http://www.w3.org/TR/2001/REC-xml-c14n-20010315`);

    await fs.writeFile(rcofXmlPath, signedRcofXml);

    const logBuildRcof = `RCOF created and signed successfully`;
    console.log(logBuildRcof);

    return logBuildRcof;
  } catch (error) {
    console.log(`ERROR: Problem building RCOF: ${error}`);
  }
}

module.exports = { buildRcof };

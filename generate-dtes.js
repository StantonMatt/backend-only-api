'use strict';

const fs = require('fs-extra');
const path = require('path');
const { create } = require('xmlbuilder2');
const {
  getExpiryDteFormattedDate,
  getIssueDteFormattedDate,
  getHastaDteFormattedDate,
  getDesdeDteFormattedDate,
  getTedFormattedTimeStamp,
} = require('./util-date.js');
const { getSheetData, cN } = require('./database.js');
const { generateCer } = require('./extract-keys.js');
const paths = require('./paths.js');

const primerFolioDisponiblePath = paths.getPrimerFolioDisponiblePath();

const cafPath = paths.getCaf39Path();
const cafPrivateKeyPath = paths.getCaf39PrivateKeyPath();
const templatePath = paths.getTemplate39Path();
const cantidadFoliosEmitidosPath = paths.getCantidadFoliosEmitidosPath();
const montoNetoBoletasPath = paths.getMontoNetoBoletasPath();
const montoIvaBoletasPath = paths.getMontoIvaBoletasPath();
const montoExentoBoletasPath = paths.getMontoExentoBoletasPath();
const montoTotalBoletasPath = paths.getMontoTotalBoletasPath();

let dteClientData;

function addDetalle(detalleObjectArray, nroLinDet, qtyItem, unmdItem) {
  if (qtyItem) {
    detalleObjectArray.forEach(detalle => {
      dteClientData.Detalle.push({
        NroLinDet: nroLinDet++,
        NmbItem: detalle.nmbItem,
        DscItem: detalle.dscItem,
        QtyItem: qtyItem,
        UnmdItem: unmdItem,
        PrcItem: detalle.prcItem,
        MontoItem: detalle.montoItem,
      });
    });
  }
  return nroLinDet;
}

function addDscRcg(dscRcgObject, nroLinDR) {
  dscRcgObject.forEach(dscRcg => {
    if (dscRcg.valorDR) {
      dteClientData.DscRcgGlobal.push({
        NroLinDR: nroLinDR++,
        TpoMov: dscRcg.tpoMov,
        GlosaDR: dscRcg.glosaDR,
        TpoValor: dscRcg.tpoValor,
        ValorDR: dscRcg.valorDR,
        IndExeDR: dscRcg.indExeDR,
      });
    }
  });
}

async function buildClientDte() {
  try {
    const logOutput = [];

    const excelDataObject = await getSheetData(0); // 0 = main excel, 1 = test excel

    // Read the CAF.xml file as utf8
    const cafFileContents = await fs.readFile(cafPath, 'utf8');
    // Parse CafFileContents to Object
    const cafFileObject = create(cafFileContents).end({ format: 'object' });
    // Create cafObject from the CAF section
    const cafObject = { CAF: cafFileObject.AUTORIZACION.CAF };

    // Extract Private Key from CAF.xml
    let cafPrivateKey = cafFileObject.AUTORIZACION.RSASK;
    await fs.writeFile(cafPrivateKeyPath, cafPrivateKey);

    let nroTotalBoletas = 0;
    for (const [_, number] of excelDataObject.entries()) {
      if (!number[cN().number]) break;
      nroTotalBoletas++;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////FIXED DATA//////////////////////////////////////////////////////

    let montoTotalBoletas = 0;
    let montoNetoBoletas = 0;
    let montoIvaBoletas = 0;
    let montoExentoBoletas = 0;

    const rutEmisor = String(excelDataObject[1][cN().rutEmisor]).toUpperCase().trim();
    const rznSocEmisor = String(excelDataObject[1][cN().rznSocEmisor]).split(/\s+/).join(' ').trim().slice(0, 100);
    const giroEmisor = String(excelDataObject[1][cN().giroEmisor]).split(/\s+/).join(' ').trim().slice(0, 80);
    const tipoDte = 39;
    const indServicio = excelDataObject[1][cN().indServicio];
    const rutProvSw = rutEmisor;
    const rutEnvia = String(excelDataObject[1][cN().rutEnvia]).toUpperCase().trim();
    const rutReceptor = String(excelDataObject[1][cN().rutReceptor]).toUpperCase().trim();
    const fchResol = String(excelDataObject[1][cN().fchResol]).toUpperCase().trim();
    const nroResol = excelDataObject[1][cN().nroResol];
    const periodoDesde = getDesdeDteFormattedDate();
    const periodoHasta = getHastaDteFormattedDate();
    const fchEmis = getIssueDteFormattedDate();
    const fchVenc = getExpiryDteFormattedDate();
    const timeStamp = getTedFormattedTimeStamp();
    const firmaSig = '@!FRMT-SIG!@';
    const signature = '@!SIGNATURE!@';
    const nroDte = '@!NUM-DTE!@';
    const dteSet = '@!SET-OF-DTE!@';

    let folio = Number(await fs.readFile(primerFolioDisponiblePath, 'binary'));
    let dtePath;
    let currentBoleta = 1;

    const logNroTotalBoletas = `Processing ${nroTotalBoletas} boletas...`;
    console.log(logNroTotalBoletas);

    const nroBoletas = 30; // REMOVE
    for (let i = 0; i < nroBoletas; i++) {
      if (excelDataObject[i][cN().isFactura]) continue;
      dtePath = path.join(__dirname, 'public', 'output', 'boletas', 'dtes', 'unsigned', `dte${currentBoleta}.xml`);

      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////DATA//////////////////////////////////////////////////////
      let nroLinDR = 1;
      let nroLinDet = 1;
      let nroLinRef = 1;

      const rutRecep = String(excelDataObject[i][cN().rutRecep]).toUpperCase().trim();
      const cdgIntRecep = String(excelDataObject[i][cN().cdgIntRecep]).trim();
      const rznSocRecep = String(excelDataObject[i][cN().rznSocRecep]).split(/\s+/).join(' ').trim();
      const correo = excelDataObject[i][cN().correo] ? String(excelDataObject[i][cN().correo]).trim() : null;
      const dirRecep = String(excelDataObject[i][cN().dirRecep]).split(/\s+/).join(' ').trim();
      const ciudadRecep = String(excelDataObject[i][cN().ciudadRecep]).split(/\s+/).join(' ').trim();
      const cmnaRecep = String(excelDataObject[i][cN().cmnaRecep]).toUpperCase().trim();

      const mntNeto = Number(excelDataObject[i][cN().mntNeto]);
      const iva = Number(excelDataObject[i][cN().iva]);
      const mntTotal = Number(excelDataObject[i][cN().mntTotal]);
      const mntExe = excelDataObject[i][cN().mntExe] ? Number(excelDataObject[i][cN().mntExe]) : null;
      const saldoAnterior = Number(excelDataObject[i][cN().saldoAnterior]);
      const vlrPagar = Number(excelDataObject[i][cN().vlrPagar]);
      const descuento = Number(excelDataObject[i][cN().descuento]);
      const subsidio = Math.abs(Number(excelDataObject[i][cN().subsidio]));
      const repactacion = Number(excelDataObject[i][cN().repactacion]);
      const reposicion = Number(excelDataObject[i][cN().reposicion]);
      const multa = Number(excelDataObject[i][cN().multa]);

      const qtyItem = Number(excelDataObject[i][cN().consumoM3]);
      const unmdItem = 'M3';

      const detalleObjectArray = [
        {
          nmbItem: cN().detalleNmbAgua,
          dscItem: cN().detalleDscAgua,
          prcItem: Number(excelDataObject[i][cN().costoM3Agua]),
          montoItem: Number(excelDataObject[i][cN().costoTotalAgua]),
        },
        {
          nmbItem: cN().detalleNmbAlcantarillado,
          dscItem: cN().detalleDscAlcantarillado,
          prcItem: Number(excelDataObject[i][cN().costoM3Alcantarillado]),
          montoItem: Number(excelDataObject[i][cN().costoTotalAlcantarillado]),
        },
        {
          nmbItem: cN().detalleNmbTratamiento,
          dscItem: cN().detalleDscTratamiento,
          prcItem: Number(excelDataObject[i][cN().costoM3Tratamiento]),
          montoItem: Number(excelDataObject[i][cN().costoTotalTratamiento]),
        },
      ];

      const cargoFijoObjectArray = [
        {
          nmbItem: cN().detalleNmbCargoFijo,
          dscItem: cN().detalleDscCargoFijo,
          qtyItem: 1,
          prcItem: Number(excelDataObject[i][cN().cargoFijo]),
          montoItem: Number(excelDataObject[i][cN().cargoFijo]),
        },
      ];

      const dscRcgObject = [
        { tpoMov: 'D', glosaDR: cN().descuento, tpoValor: '$', valorDR: descuento },
        { tpoMov: 'R', glosaDR: cN().reposicion, tpoValor: '$', valorDR: reposicion },
        { tpoMov: 'R', glosaDR: cN().multa, tpoValor: '$', valorDR: multa },
        { tpoMov: 'D', glosaDR: cN().subsidio, tpoValor: '$', valorDR: subsidio, indExeDR: 1 },
        { tpoMov: 'R', glosaDR: cN().repactacion, tpoValor: '$', valorDR: repactacion, indExeDR: 1 },
      ];

      montoNetoBoletas += mntNeto;
      montoIvaBoletas += iva;
      montoExentoBoletas += mntExe;
      montoTotalBoletas += mntTotal;

      // //////////////////////////////////////////////////////////////////////////////////
      // /////////////////////////////////CLIENT DTE JSON//////////////////////////////////
      dteClientData = {
        Encabezado: {
          IdDoc: {
            TipoDTE: tipoDte,
            Folio: folio,
            FchEmis: fchEmis,
            IndServicio: indServicio,
            PeriodoDesde: periodoDesde,
            PeriodoHasta: periodoHasta,
            FchVenc: fchVenc,
          },
          Emisor: {
            RUTEmisor: rutEmisor,
            RznSocEmisor: rznSocEmisor,
            GiroEmisor: giroEmisor,
          },
          Receptor: {
            RUTRecep: rutRecep,
            CdgIntRecep: cdgIntRecep,
            RznSocRecep: rznSocRecep,
            Contacto: correo,
            DirRecep: dirRecep,
            CmnaRecep: cmnaRecep,
            CiudadRecep: ciudadRecep,
          },
          Totales: {
            MntNeto: mntNeto,
            MntExe: mntExe,
            IVA: iva,
            MntTotal: mntTotal,
            SaldoAnterior: saldoAnterior,
            VlrPagar: vlrPagar,
          },
        },
        Detalle: [],
        DscRcgGlobal: [],
        // Referencia: {
        //   NroLinRef: nroLinRef,
        //   CodRef: codRef,
        //   RazonRef: razonRef,
        // },
      };
      nroLinDet = addDetalle(detalleObjectArray, nroLinDet, qtyItem, unmdItem);
      addDetalle(cargoFijoObjectArray, nroLinDet, 1);
      addDscRcg(dscRcgObject, nroLinDR);

      //////////////////////////////////////////////////////////////////////////////////
      /////////////////////////////////CLIENT TED JSON//////////////////////////////////
      const ted = {
        DD: {
          RE: rutEmisor,
          TD: tipoDte,
          F: folio,
          FE: fchEmis,
          RR: rutRecep,
          RSR: rznSocRecep,
          MNT: mntTotal,
          IT1: cN().detalleDscAgua,
          CAF: cafObject.CAF,
          TSTED: timeStamp,
        },
        FRMT: { '@algoritmo': 'SHA1withRSA', '#': firmaSig },
      };

      // Create a Document out of the signedTedString and parse to Object
      const tedObject = create().ele('TED', { version: '1.0' }).ele(ted).end({ format: 'object' });

      // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // Combine DTE Client Object with TED Object and add a Timestamp to the end
      const dteObject = { ...dteClientData, ...tedObject };
      // Create a DTE Document from the combined data
      const dteDoc = create()
        // Add the root element 'DTE' with its version attribute
        .ele('DTE', { version: '1.0' })
        // Add the 'Documento' element including RUTEmisor, TipoDTE and Folio
        .ele('Documento', { ID: `F${folio}_T${tipoDte}` })
        // Add the dteObject data
        .ele(dteObject)
        .up()
        .ele('TmstFirma')
        .txt(timeStamp)
        .up()
        .up()
        .ele('Signature')
        .txt(signature);
      // Convert the built document structure into a formatted XML string.
      const dteXml = dteDoc.end({ prettyPrint: true }).replace('<?xml version="1.0"?>\n', '');
      await fs.writeFile(dtePath, dteXml);

      folio++;
      nroLinRef++;
      currentBoleta++;
    }

    // Create Document from the DteSobreObject, addding required attributes
    const dteSobreDoc = create({ version: '1.0', encoding: 'ISO-8859-1' })
      .ele('EnvioBOLETA', {
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation': 'http://www.sii.cl/SiiDte EnvioBOLETA_v11.xsd',
        xmlns: 'http://www.sii.cl/SiiDte',
        version: '1.0',
      })
      .ele('SetDTE', { ID: 'SetDoc' })
      .ele('Caratula', { version: '1.0' })
      .ele('RutEmisor')
      .txt(rutEmisor)
      .up()
      .ele('RutEnvia')
      .txt(rutEnvia)
      .up()
      .ele('RutReceptor')
      .txt(rutReceptor)
      .up()
      .ele('FchResol')
      .txt(fchResol)
      .up()
      .ele('NroResol')
      .txt(nroResol)
      .up()
      .ele('TmstFirmaEnv')
      .txt(timeStamp)
      .up()
      .ele('SubTotDTE')
      .ele('TpoDTE')
      .txt(tipoDte)
      .up()
      .ele('NroDTE')
      .txt(nroDte)
      .up()
      .up()
      .up()
      .ele('DTE')
      .txt(dteSet)
      .up()
      .up()
      .ele('Signature')
      .txt(signature);

    // Parse the Sobre Doc to prettyPrinted XML format
    const dteSobreXml = dteSobreDoc.end({ prettyPrint: true });

    const logSobre = `Unsigned DTE's created successfully...`;
    console.log(logSobre);

    await fs.writeFile(templatePath, dteSobreXml);
    await fs.writeFile(cantidadFoliosEmitidosPath, String(nroBoletas));
    await fs.writeFile(montoNetoBoletasPath, String(montoNetoBoletas));
    await fs.writeFile(montoIvaBoletasPath, String(montoIvaBoletas));
    await fs.writeFile(montoExentoBoletasPath, String(montoExentoBoletas));
    await fs.writeFile(montoTotalBoletasPath, String(montoTotalBoletas));

    await generateCer();
    logOutput.push(logNroTotalBoletas, logSobre);
    return logOutput;
  } catch (error) {
    console.log(`XML build has failed: ${error}`);
  }
}

module.exports = { buildClientDte };

'use strict';

const fs = require('fs-extra');
const path = require('path');
const { create } = require('xmlbuilder2');
const { getExpiryDteFormattedDate } = require('./util-date.js');
const { getSheetData, cN } = require('./database.js');
const { generateCer } = require('./extract-keys.js');
const paths = require('./paths.js');

const primerFolioDisponiblePath = paths.getPrimerFolioDisponiblePath();

const cafPath = paths.getCafPath();
const cafPrivateKeyPath = paths.getCafPrivateKeyPath();
const templatePath = paths.getTemplateFile39Path();
const cantidadFoliosEmitidosPath = paths.getCantidadFoliosEmitidosPath();
const montoNetoBoletasPath = paths.getMontoNetoBoletasPath();
const montoIvaBoletasPath = paths.getMontoIvaBoletasPath();
const montoExentoBoletasPath = paths.getMontoExentoBoletasPath();
const montoTotalBoletasPath = paths.getMontoTotalBoletasPath();

let dteClientData;

function addDetalle(detalleObjectArray, nroLinDet, qtyItem, unmdItem) {
  detalleObjectArray.forEach(detalle => {
    dteClientData.Detalle.push({
      NroLinDet: nroLinDet++,
      NmbItem: detalle.nmbItem,
      DscItem: detalle.dscItem,
      QtyItem: detalle.nmbItem === 'Cargo Fijo' ? 1 : qtyItem,
      UnmdItem: detalle.nmbItem === 'Cargo Fijo' ? null : unmdItem,
      PrcItem: detalle.prcItem,
      MontoItem: detalle.montoItem,
    });
  });
}

function addDscRcg(dscRcgObject, nroLinDR) {
  dscRcgObject.forEach(dscRcg => {
    if (dscRcg.ValorDR) {
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
    const excelDataObject = await getSheetData('test');

    // Read the CAF.xml file as utf8
    const cafFileContents = await fs.readFile(cafPath, 'utf8');
    // Parse CafFileContents to Object
    const cafFileObject = create(cafFileContents).end({ format: 'object' });
    // Create cafObject from the CAF section
    const cafObject = { CAF: cafFileObject.AUTORIZACION.CAF };

    // Extract Private Key from CAF.xml
    let cafPrivateKey = cafFileObject.AUTORIZACION.RSASK;
    await fs.writeFile(cafPrivateKeyPath, cafPrivateKey);

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////FIXED DATA//////////////////////////////////////////////////////

    let nroTotalBoletas = 0;
    let montoNetoBoletas = 0;
    let montoIvaBoletas = 0;
    let montoExentoBoletas = 0;
    let montoTotalBoletas = 0;
    for (const [_, number] of excelDataObject.entries()) {
      nroTotalBoletas++;
      if (!number.Numero) break;
    }

    const rutEmisor = String(excelDataObject[0][cN.rutEmisor]).toUpperCase().trim();
    const rznSocEmisor = String(excelDataObject[0][cN().rznSocEmisor]).split(/\s+/).join(' ').trim().slice(0, 70);
    const giroEmisor = String(excelDataObject[0][cN().giroEmisor]).split(/\s+/).join(' ').trim().slice(0, 70);
    const tipoDte = 39;
    const indServicio = excelDataObject[0][cN().indServicio];
    const rutProvSw = rutEmisor;
    const rutEnvia = String(excelDataObject[0][cN.rutEnvia]).toUpperCase().trim();
    const rutReceptor = String(excelDataObject[0][cN.rutReceptor]).toUpperCase().trim();
    const fchResol = String(excelDataObject[0][cN.fchResol]).toUpperCase().trim();
    const nroResol = excelDataObject[0][cN().nroResol];
    const fchVenc = getExpiryDteFormattedDate();
    const fchEmis = '@!FECHA!@';
    const timeStamp = '@!TIMESTAMP!@';
    const firmaSig = '@!FRMT-SIG!@';
    const signature = '@!SIGNATURE!@';
    const nroDte = '@!NUM-DTE!@';
    const dteSet = '@!SET-OF-DTE!@';

    let folio = Number(await fs.readFile(primerFolioDisponiblePath, 'binary'));
    let dtePath;
    const nroBoletas = 5;
    for (let i = 0; i < nroBoletas; i++) {
      dtePath = path.join(__dirname, 'assets', 'output', 'boletas', 'dtes', 'unsigned', `dte${i + 1}.xml`);

      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////DATA//////////////////////////////////////////////////////
      let nroLinDR = 1;
      let nroLinDet = 1;
      let nroLinRef = 1;

      const rutRecep = String(excelDataObject[i][cN().rutRecep]).toUpperCase().trim();
      const cdgIntRecep = String(excelDataObject[i][cN().cdgIntRecep]).trim();
      const rznSocRecep = String(excelDataObject[i][cN().rznSocRecep]).split(/\s+/).join(' ').trim();
      // const Contacto = String(excelDataObject[i][cN().correo]).trim();
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
      const subsidio = Number(excelDataObject[i][cN().subsidio]);
      const repactacion = Number(excelDataObject[i][cN().repactacion]);
      const reposicion = Number(excelDataObject[i][cN().reposicion]);
      const multa = Number(excelDataObject[i][cN().multa]);

      const qtyItem = Number(excelDataObject[i][cN().consumoM3]);
      const unmdItem = 'M3';

      const detalleObject = [
        {
          NmbItem: 'Agua',
          DscItem: 'Consumo de Agua Potable',
          PrcItem: Number(excelDataObject[i][cN().costoM3Agua]),
          MontoItem: Number(excelDataObject[i][cN().costoTotalAgua]),
        },
        {
          NmbItemo: 'Alcantarillado',
          DscItem: 'Recoleccion de Aguas Servidas',
          PrcItem: Number(excelDataObject[i][cN().costoM3Alcantarillado]),
          MontoItem: Number(excelDataObject[i][cN().costoTotalAlcantarillado]),
        },
        {
          NmbItem: 'Tratamiento',
          DscItem: 'Tratamiento de Aguas Servidas',
          PrcItem: Number(excelDataObject[i][cN().costoM3Tratamiento]),
          MontoItem: Number(excelDataObject[i][cN().costoTotalTratamiento]),
        },
        {
          NmbItem: 'Cargo Fijo',
          DscItem: 'Cargo Fijo',
          PrcItem: Number(excelDataObject[i][cN().cargoFijo]),
          MontoItem: Number(excelDataObject[i][cN().cargoFijo]),
        },
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
            FchVenc: fchVenc,
          },
          Emisor: {
            RUTEmisor: rutEmisor,
            RznSocEmisor: rznSocEmisor,
            GiroEmisor: giroEmisor,
          },
          Receptor: {
            RUTRecep: rutRecep,
            RznSocRecep: rznSocRecep,
            DirRecep: dirRecep,
            CmnaRecep: cmnaRecep,
            CiudadRecep: ciudadRecep,
          },
          Totales: {
            MntNeto: mntNeto,
            MntExe: mntExe,
            IVA: iva,
            MntTotal: mntTotal,
          },
        },
        Detalle: [],
        DscRcgGlobal: [],
        Referencia: {
          NroLinRef: nroLinRef,
          CodRef: codRef,
          RazonRef: razonRef,
        },
        // RUTProvSW,
      };
      addDetalle(detalleObject, nroLinDet);

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
          IT1: detalleObject[0].nmbItem,
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

    await fs.writeFile(templatePath, dteSobreXml);
    await fs.writeFile(cantidadFoliosEmitidosPath, String(nroBoletas));
    await fs.writeFile(montoNetoBoletasPath, String(montoNetoBoletas));
    await fs.writeFile(montoIvaBoletasPath, String(montoIvaBoletas));
    await fs.writeFile(montoExentoBoletasPath, String(montoExentoBoletas));
    await fs.writeFile(montoTotalBoletasPath, String(montoTotalBoletas));

    // runServer(excelDataObject[0], {}, signedSobreXml);
    await generateCer();
  } catch (error) {
    console.log(`XML build has failed: ${error}`);
  }
}

module.exports = { buildClientDte };

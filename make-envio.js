'use strict';

const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');
const { create, convert } = require('xmlbuilder2');
const { getExpiryDteFormattedDate } = require('./util.js');
const { getClientData2 } = require('./database.js');
const { generateCer } = require('./generate-cer.js');

const folioPath = path.join(__dirname, 'agricola-la-frontera', 'folio_disponible.txt');

const cafPath = path.join(__dirname, 'assets', 'CAFAGRICOLA.xml');
const cafPrivateKeyPath = path.join(__dirname, 'assets', 'keys', 'caf39.key');
const templatePath = path.join(__dirname, 'assets', 'templates', 'sobre_template39.xml');

let dteClientData;

function addDetalle(detalleObjectArray, NroLinDet, QtyItem, UnmdItem) {
  detalleObjectArray.forEach(detalle => {
    dteClientData.Detalle.push({
      NroLinDet: NroLinDet++,
      IndExe: detalle.IndExe,
      NmbItem: detalle.NmbItem,
      QtyItem: detalle.QtyItem,
      PrcItem: detalle.PrcItem,
      MontoItem: detalle.MontoItem,
    });
  });
}

function addDscRcg(dscRcgObject, NroLinDR) {
  dscRcgObject.forEach(dscRcg => {
    if (dscRcg.ValorDR) {
      dteClientData.DscRcgGlobal.push({
        NroLinDR: NroLinDR++,
        TpoMov: dscRcg.TpoMov,
        GlosaDR: dscRcg.GlosaDR,
        TpoValor: dscRcg.TpoValor,
        ValorDR: dscRcg.ValorDR,
        IndExeDR: dscRcg.IndExeDR,
      });
    }
  });
}

async function buildClientDte() {
  try {
    const excelDataObject = await getClientData2();

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
    for (const [_, number] of excelDataObject.entries()) {
      nroTotalBoletas++;
      if (!number.Numero) break;
    }
    const nroMaxBoletasPorSobre = 50;
    const RUTEmisor = String(excelDataObject[0].RUTEmisor).toUpperCase().trim();
    const RznSocEmisor = 'AGRICOLA LA FRONTERA LIMITADA';
    const GiroEmisor = 'CULTIVO DE PRODUCTOS AGRICOLAS EN COMBINACION CON LA CRIA DE ANIMALES';
    const TipoDTE = 39;
    const IndServicio = 3;
    const RUTProvSW = String(excelDataObject[0].RUTEmisor).toUpperCase().trim();
    const RutEnvia = '5657540-5';
    const RutReceptor = '60803000-K';
    const FchResol = '2024-04-01';
    const NroResol = 0;
    const FchVenc = getExpiryDteFormattedDate();
    // const TmstFirmaEnv = getTedFormattedTimeStamp();
    const TpoDTE = TipoDTE;
    let NroDTE = 5;

    let Folio = Number(await fs.readFile(folioPath, 'binary'));
    let dtePath;
    for (let i = 0; i < 5; i++) {
      // console.log(nroTotalBoletas);

      dtePath = path.join(__dirname, 'assets', 'dtes', '39', `dte${i}.xml`);

      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////DATA//////////////////////////////////////////////////////

      let NroLinDR = 1;
      let NroLinDet = 1;
      let NroLinRef = 1;

      const CodRef = String(excelDataObject[i].CodRef).trim();
      const RazonRef = String(excelDataObject[i].RazonRef).trim();

      const NmbItem1 = excelDataObject[i].NmbItem1 ? String(excelDataObject[i].NmbItem1).split(/\s+/).join(' ').trim() : undefined;
      const NmbItem2 = excelDataObject[i].NmbItem2 ? String(excelDataObject[i].NmbItem2).split(/\s+/).join(' ').trim() : undefined;

      const DscItem1 = excelDataObject[i].DscItem1 ? String(excelDataObject[i].DscItem1).split(/\s+/).join(' ').trim() : undefined;
      const DscItem2 = excelDataObject[i].DscItem2 ? String(excelDataObject[i].DscItem2).split(/\s+/).join(' ').trim() : undefined;

      const QtyItem1 = Number(excelDataObject[i].QtyItem1);
      const QtyItem2 = Number(excelDataObject[i].QtyItem2);

      const UnmdItem = 'UN';

      const PrcItem1 = Number(excelDataObject[i].PrcItem1);
      const PrcItem2 = Number(excelDataObject[i].PrcItem2);

      const MontoItem1 = Number(excelDataObject[i].MontoItem1);
      const MontoItem2 = Number(excelDataObject[i].MontoItem2);

      let IndExe1 = NmbItem1 && NmbItem1.includes('exento') ? 2 : null;
      let IndExe2 = NmbItem2 && NmbItem2.includes('exento') ? 2 : null;

      const RUTRecep = String(excelDataObject[i].RUTRecep).toUpperCase().trim();
      const CdgIntRecep = String(excelDataObject[i].CdgIntRecep).trim();
      const RznSocRecep = String(excelDataObject[i].RznSocRecep).split(/\s+/).join(' ').trim();
      // const Contacto = String(excelDataObject[i].contacto).trim();
      const DirRecep = String(excelDataObject[i].DirRecep).split(/\s+/).join(' ').trim();
      const CmnaRecep = 'VILCUN';
      const CiudadRecep = String(excelDataObject[i].CiudadRecep).split(/\s+/).join(' ').trim();

      const MntNeto = Number(excelDataObject[i].MntNeto);
      const IVA = Number(excelDataObject[i].IVA);
      const MntTotal = Number(excelDataObject[i].MntTotal);
      const SaldoAnterior = Number(excelDataObject[i].SaldoAnterior);
      const VlrPagar = Number(excelDataObject[i].VlrPagar);

      const Descuento = Number(excelDataObject[i].Descuento);
      const Subsidio = Number(excelDataObject[i].Subsidio);
      const Repactacion = Number(excelDataObject[i].Repactacion);
      const Reposicion = Number(excelDataObject[i].Reposicion);
      const Multa = Number(excelDataObject[i].Multa);
      const Otros = Number(excelDataObject[i].Otros);

      const QtyItem = Number(excelDataObject[i].ConsumoM3);

      const detalleObject = [];

      if (NmbItem1) {
        detalleObject.push({
          IndExe: IndExe1,
          NmbItem: NmbItem1,
          DscItem: DscItem1,
          QtyItem: QtyItem1,
          UnmdItem,
          PrcItem: PrcItem1,
          MontoItem: MontoItem1,
        });
      }
      if (NmbItem2) {
        detalleObject.push({
          IndExe: IndExe2,
          NmbItem: NmbItem2,
          DscItem: DscItem2,
          QtyItem: QtyItem2,
          UnmdItem,
          PrcItem: PrcItem2,
          MontoItem: MontoItem2,
        });
      }

      // //////////////////////////////////////////////////////////////////////////////////
      // /////////////////////////////////CLIENT DTE JSON//////////////////////////////////
      dteClientData = {
        Encabezado: {
          IdDoc: {
            TipoDTE,
            Folio,
            FchEmis: '@!FECHA!@',
            IndServicio,
            FchVenc,
          },
          Emisor: {
            RUTEmisor,
            RznSocEmisor,
            GiroEmisor,
          },
          Receptor: {
            RUTRecep,
            RznSocRecep,
            DirRecep,
            CmnaRecep,
            CiudadRecep,
          },
          Totales: {
            MntNeto,
            IVA,
            MntTotal,
          },
        },
        Detalle: [],
        DscRcgGlobal: [],
        Referencia: {
          NroLinRef,
          CodRef,
          RazonRef,
        },
        // RUTProvSW,
      };
      addDetalle(detalleObject, NroLinDet, QtyItem, UnmdItem);

      //////////////////////////////////////////////////////////////////////////////////
      /////////////////////////////////CLIENT TED JSON//////////////////////////////////
      const ted = {
        DD: {
          RE: RUTEmisor,
          TD: TipoDTE,
          F: Folio,
          FE: '@!FECHA!@',
          RR: RUTRecep,
          RSR: RznSocRecep,
          MNT: MntTotal,
          IT1: detalleObject[0].NmbItem,
          CAF: cafObject.CAF,
          TSTED: '@!TIMESTAMP!@',
        },
        FRMT: { '@algoritmo': 'SHA1withRSA', '#': '@!FRMT-SIG!@' },
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
        .ele('Documento', { ID: `F${Folio}_T${TipoDTE}` })
        // Add the dteObject data
        .ele(dteObject)
        .up()
        .ele('TmstFirma')
        .txt('@!TIMESTAMP!@')
        .up()
        .up()
        .ele('Signature')
        .txt('@!SIGNATURE!@');
      // Convert the built document structure into a formatted XML string.
      const dteXml = dteDoc.end({ prettyPrint: true }).replace('<?xml version="1.0"?>\n', '');
      await fs.writeFile(dtePath, dteXml);

      Folio++;
      NroLinRef++;
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
      .txt(RUTEmisor)
      .up()
      .ele('RutEnvia')
      .txt(RutEnvia)
      .up()
      .ele('RutReceptor')
      .txt(RutReceptor)
      .up()
      .ele('FchResol')
      .txt(FchResol)
      .up()
      .ele('NroResol')
      .txt(NroResol)
      .up()
      .ele('TmstFirmaEnv')
      .txt('@!TIMESTAMP!@')
      .up()
      .ele('SubTotDTE')
      .ele('TpoDTE')
      .txt(TpoDTE)
      .up()
      .ele('NroDTE')
      .txt('@!NUM-DTE!@')
      .up()
      .up()
      .up()
      .ele('DTE')
      .txt('@!SET-OF-DTE!@')
      .up()
      .up()
      .ele('Signature')
      .txt('@!SIGNATURE!@');

    // Parse the Sobre Doc to prettyPrinted XML format
    const dteSobreXml = dteSobreDoc.end({ prettyPrint: true });

    await fs.writeFile(templatePath, dteSobreXml);
    const form = new FormData();
    form.append('rutSender', RutEnvia.slice(0, RutEnvia.indexOf('-') + 1));
    form.append('dvSender', RutEnvia.slice(-1));
    form.append('rutCompany', RUTEmisor.slice(0, RutEnvia.indexOf('-') + 1));
    form.append('dvCompany', RUTEmisor.slice(-1));
    form.append('archivo', fs.createReadStream(templatePath));

    // runServer(excelDataObject[0], {}, signedSobreXml);
    await generateCer();
    return form;
  } catch (error) {
    console.log(`XML build has failed: ${error}`);
  }
}

module.exports = { buildClientDte };

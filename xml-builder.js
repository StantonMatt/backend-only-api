'use strict';

const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');
const { create, convert } = require('xmlbuilder2');
const { signXml } = require('./xml-signer.js');
const { extractModulus, extractExponent } = require('./extract-keys.js');
const { getClientData } = require('./database.js');
const { runServer } = require('./server.js');
const { getTodayDteFormattedDate, getExpiryDteFormattedDate, getTedFormattedTimeStamp } = require('./util.js');

const folioPath = path.join(__dirname, 'assets', 'folio_disponible.txt');
const cafPath = path.join(__dirname, 'assets', 'CAF.xml');
const privateKeyPath = path.join(__dirname, 'temp', 'output', 'private_key.pem');
const publicCertPath = path.join(__dirname, 'temp', 'output', 'certificate.pem');

const testPath = path.join(__dirname, 'examples', 'F60T33-ejemplo.xml');

let dteClientData;

function addDetalle(detalleObjectArray, NroLinDet, QtyItem, UnmdItem) {
  detalleObjectArray.forEach(detalle => {
    dteClientData.Detalle.push({
      NroLinDet: NroLinDet++,
      NmbItem: detalle.NmbItem,
      DscItem: detalle.DscItem,
      QtyItem: detalle.NmbItem === 'Cargo Fijo' ? 1 : QtyItem,
      UnmdItem: detalle.NmbItem === 'Cargo Fijo' ? null : UnmdItem,
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
    const excelDataObject = await getClientData();

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////FIXED DATA//////////////////////////////////////////////////////

    let nroTotalBoletas = 0;
    for (const [_, number] of excelDataObject.entries()) {
      nroTotalBoletas++;
      if (!number.Numero) break;
    }
    const nroMaxBoletasPorSobre = 50;
    const RUTEmisor = String(excelDataObject[0].RUTEmisor).toUpperCase().trim();
    const RznSocEmisor = 'COOPERATIVA DE SERVICIO DE ABASTECIMIENTO Y DISTRIBUCION DE AGUA POTABLE ALCANTARILLADO Y SANEAMIENT';
    const GiroEmisor = 'Prestación de Servicios Sanitarios';
    const TipoDTE = 39;
    const IndServicio = 2;
    const RUTProvSW = String(excelDataObject[0].RUTEmisor).toUpperCase().trim();
    const RutEnvia = '5657540-5';
    const RutReceptor = '60803000-K';
    const FchResol = '30-12-2020';
    const NroResol = 0;
    const TmstFirmaEnv = getTedFormattedTimeStamp();
    const TpoDTE = TipoDTE;
    let NroDTE = nroTotalBoletas - nroMaxBoletasPorSobre > 0 ? nroMaxBoletasPorSobre : nroTotalBoletas;

    let dteSobreObject = {
      Caratula: {
        '@version': '1.0',
        RutEmisor: RUTEmisor,
        RutEnvia,
        RutReceptor,
        FchResol,
        NroResol,
        TmstFirmaEnv,
        SubTotDTE: {
          TpoDTE,
          NroDTE,
        },
      },
      DTE: [],
    };

    // Read the CAF.xml file as utf8
    const cafFileContents = await fs.readFile(cafPath, 'utf8');
    // Parse CafFileContents to Object
    const cafFileObject = create(cafFileContents).end({ format: 'object' });
    // Create cafObject from the CAF section
    const cafObject = { CAF: cafFileObject.AUTORIZACION.CAF };

    // Getting keys from Digital Certificates(.pfx) for use in signing
    const publicCert = await fs.readFile(publicCertPath, 'utf8');
    const privateKey = await fs.readFile(privateKeyPath, 'utf8');
    const modulus = await extractModulus();
    const exponent = await extractExponent();

    // Extract Private Key from CAF.xml
    const cafPrivateKey = cafFileObject.AUTORIZACION.RSASK;

    let Folio = Number(await fs.readFile(folioPath, 'binary'));
    let dtePath;
    for (let i = 0; i < 4; i++) {
      // console.log(nroTotalBoletas);

      dtePath = path.join(__dirname, 'temp', 'output', 'dtes', `dte${i}.xml`);

      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////DATA//////////////////////////////////////////////////////
      const TSTED = getTedFormattedTimeStamp();

      let NroLinDR = 1;
      let NroLinDet = 1;

      const FchEmis = getTodayDteFormattedDate();
      const FchVenc = getExpiryDteFormattedDate();

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
      const UnmdItem = 'Metros Cubicos';
      const detalleObject = [
        {
          NmbItem: 'Agua',
          DscItem: 'Consumo de Agua Potable',
          PrcItem: Number(excelDataObject[i].CostoM3Agua),
          MontoItem: Number(excelDataObject[i].CostoTotalAgua),
        },
        {
          NmbItemo: 'Alcantarillado',
          DscItem: 'Recoleccion de Aguas Servidas',
          PrcItem: Number(excelDataObject[i].CostoM3Alcantarillado),
          MontoItem: Number(excelDataObject[i].CostoTotalAlcantarillado),
        },
        {
          NmbItem: 'Tratamiento',
          DscItem: 'Tratamiento de Aguas Servidas',
          PrcItem: Number(excelDataObject[i].CostoM3Tratamiento),
          MontoItem: Number(excelDataObject[i].CostoTotalTratamiento),
        },
        {
          NmbItem: 'Cargo Fijo',
          DscItem: 'Cargo Fijo',
          PrcItem: Number(excelDataObject[i].CargoFijo),
          MontoItem: Number(excelDataObject[i].CargoFijo),
        },
      ];

      const dscRcgObject = [
        { TpoMov: 'D', GlosaDR: 'Descuento', TpoValor: '$', ValorDR: Descuento },
        { TpoMov: 'D', GlosaDR: 'Subsidio', TpoValor: '$', ValorDR: Subsidio, IndExeDR: 1 },
        { TpoMov: 'R', GlosaDR: 'Repactacion', TpoValor: '$', ValorDR: Repactacion, IndExeDR: 1 },
        { TpoMov: 'R', GlosaDR: 'Reposicion', TpoValor: '$', ValorDR: Reposicion },
        { TpoMov: 'R', GlosaDR: 'Multa', TpoValor: '$', ValorDR: Multa },
        { TpoMov: 'R', GlosaDR: 'Otros', TpoValor: '$', ValorDR: Otros },
      ];

      //////////////////////////////////////////////////////////////////////////////////
      /////////////////////////////////CLIENT TED JSON//////////////////////////////////
      const ted = {
        DD: {
          RE: RUTEmisor,
          TD: TipoDTE,
          F: Folio,
          FE: FchEmis,
          RR: RUTRecep,
          RSR: RznSocRecep,
          MNT: MntTotal,
          IT1: detalleObject[0].DscItem,
          CAF: cafObject.CAF,
          TSTED,
        },
      };
      // ted.DD.CAF = cafObject.CAF;
      // ted.DD.TSTED = TSTED;

      //////////////////////////////////////////////////////////////////////////////////
      /////////////////////////////////CLIENT DTE JSON//////////////////////////////////
      dteClientData = {
        Encabezado: {
          IdDoc: {
            TipoDTE,
            Folio,
            FchEmis,
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
            CdgIntRecep,
            RznSocRecep,
            // Contacto,
            DirRecep,
            CmnaRecep,
            CiudadRecep,
          },
          RUTProvSW,
          Totales: {
            MntNeto,
            IVA,
            MntTotal,
            SaldoAnterior,
            VlrPagar,
          },
        },
        Detalle: [],
        DscRcgGlobal: [],
      };
      addDetalle(detalleObject, NroLinDet, QtyItem, UnmdItem);
      addDscRcg(dscRcgObject, NroLinDR);

      // Create a Document out of the ted object and parse to String
      const tedString = create().ele(ted).toString();
      // Create signer to sign tedString and update it with content to sign(tedString)
      const tedSigner = crypto.createSign('RSA-SHA256').update(tedString);
      // Sign the String and get the Signature
      const tedSignature = tedSigner.sign(cafPrivateKey, 'base64');
      // Recreate the XML as a String, including the Signature
      const signedTedString = '<TED version="1.0">' + tedString + `<FRMT algoritmo="SHA1withRSA">${tedSignature}</FRMT></TED>`;
      // Create a Document out of the signedTedString and parse to Object
      const signedTedObject = create().ele(signedTedString).end({ format: 'object' });

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // Combine DTE Client Object with TED Object and add a Timestamp to the end
      const dteObject = { ...dteClientData, ...signedTedObject, TmstFirma: TSTED };
      // Create a DTE Document from the combined data
      const dteDoc = create({ version: '1.0', encoding: 'ISO-8859-1' })
        // Add the root element 'DTE' with its version attribute
        .ele('DTE', { version: '1.0' })
        // Add the 'Documento' element including RUTEmisor, TipoDTE and Folio
        .ele('Documento', { ID: `DTE_${RUTEmisor.slice(0, RUTEmisor.indexOf('-'))}_T${TipoDTE}_F${Folio}` })
        // Add the dteObject data
        .ele(dteObject);
      // Convert the built document structure into a formatted XML string.
      const dteXml = dteDoc.end({ prettyPrint: true });

      // Sign DTE with private key and certificate targetting the 'Documento' element
      const signedDteXml = await signXml('Documento', dteXml, privateKey, publicCert, modulus, exponent);
      // Parse the signedDteXml to an Object
      const signedDteObject = convert({ encoding: 'UTF-8' }, signedDteXml, { format: 'object' });

      // Push all signed DTE Objects into the Sobre Object
      dteSobreObject.DTE.push(signedDteObject.DTE);

      // // Create a DOC out of the signedDteXml adding required attributes then parse to prettyPrinted XML
      // const formattedSignedDteXml = create({ version: '1.0', encoding: 'ISO-8859-1' }).ele(signedDteXml).end({ prettyPrint: true });
      // // Save the reformatted, signed DTE XML document to the file system for storage or further processing.
      // await fs.writeFile(dtePath, formattedSignedDteXml);

      Folio++;
    }

    // Create Document from the DteSobreObject, addding required attributes
    const dteSobreDoc = create({ version: '1.0', encoding: 'ISO-8859-1' })
      .ele('EnvioBOLETA', {
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation': 'http://www.sii.cl/SiiDte EnvioBOLETA_v11.xsd',
        version: '1.0',
        xmlns: 'http://www.sii.cl/SiiDte',
      })
      .ele('SetDTE', { ID: 'SetDoc' })
      .ele(dteSobreObject);
    // Parse the Sobre Doc to prettyPrinted XML format
    const dteSobreXml = dteSobreDoc.end({ prettyPrint: true });
    // Sign the DteSobreXml according to specs
    const signedSobreXml = await signXml('SetDTE', dteSobreXml, privateKey, publicCert, modulus, exponent);

    const form = new FormData();
    form.append('rutSender', RutEnvia.slice(0, RutEnvia.indexOf('-')));
    form.append('dvSender', RutEnvia.slice(RutEnvia.indexOf('-') + 1));
    form.append('rutCompany', RUTEmisor.slice(0, RutEnvia.indexOf('-')));
    form.append('dvCompany', RUTEmisor.slice(RutEnvia.indexOf('-') + 1));
    form.append('archivo', signedSobreXml);

    runServer(excelDataObject[0], {}, signedSobreXml);
    return form;
  } catch (error) {
    console.log(`XML build has failed: ${error}`);
  }
}

module.exports = { buildClientDte };

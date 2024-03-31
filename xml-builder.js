'use strict';

const fs = require('fs-extra');
const xml2js = require('xml2js');
const path = require('path');
const crypto = require('crypto');
const { SignedXml } = require('xml-crypto');
const { builder, create, convert } = require('xmlbuilder2');
const { signXml, signTed } = require('./xml-signer.js');
const { extractModulus, extractExponent } = require('./extract-keys.js');
const { getClientData } = require('./database.js');
const { runServer } = require('./server.js');
const { getTodayDteFormattedDate, getExpiryDteFormattedDate, getTedFormattedTimeStamp } = require('./util.js');

const folioPath = path.join(__dirname, 'assets', 'folio_disponible.txt');
const cafPath = path.join(__dirname, 'assets', 'CAF.xml');
const privateKeyPath = path.join(__dirname, 'temp', 'output', 'private_key.pem');
const publicCertPath = path.join(__dirname, 'temp', 'output', 'certificate.pem');

const parser = new xml2js.Parser();

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

    const RUTEmisor = String(excelDataObject[0].RUTEmisor).toUpperCase().trim();
    const RznSocEmisor = 'COOPERATIVA DE SERVICIO DE ABASTECIMIENTO Y DISTRIBUCION DE AGUA POTABLE ALCANTARILLADO Y SANEAMIENT';
    const GiroEmisor = 'Prestación de servicios sanitarios';
    const TipoDTE = 39;
    const IndServicio = 2;
    const RUTProvSW = String(excelDataObject[0].RUTEmisor).toUpperCase().trim();
    const RutEnvia = '5657540-5';
    const RutReceptor = '60803000-K';
    const FchResol = '30-12-2020';
    const NroResol = 0;
    const TmstFirmaEnv = getTedFormattedTimeStamp();
    const TpoDTE = TipoDTE;
    let NroDTE = 0;
    for (const [_, number] of excelDataObject.entries()) {
      NroDTE++;
      if (!number.Numero) break;
    }
    console.log(NroDTE);

    let dteSobreObject = {
      //   <?xml version="1.0" encoding="ISO-8859-1"?>
      // <EnvioDTE xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sii.cl/SiiDte EnvioDTE_v10.xsd" version="1.0" xmlns="http://www.sii.cl/SiiDte">
      //     <SetDTE ID="FENV010">
      //         <Caratula version="1.0">
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
    };

    // Read the CAF.xml file to obtain the CAF  data
    const cafFileContents = await fs.readFile(cafPath);
    // Parse the CAF XML content into a JavaScript object for easier data manipulation
    const cafParsedData = await parser.parseStringPromise(cafFileContents);
    // Extract the 'DA' section from the CAF data
    const daData = cafParsedData.AUTORIZACION.CAF[0].DA[0];

    // Extract the 'FRMA' section from the CAF data
    const frmaData = cafParsedData.AUTORIZACION.CAF[0].FRMA[0]._;
    // Format manually with signature algorithm and parse to Object
    const frmaObject = convert(`<FRMA algoritmo="Sha1withRSA">${frmaData}</FRMA>`, { format: 'object' });

    // Combine DA and FRMA
    const mergedDaFrmaObjects = { DA: { ...daData }, ...frmaObject };
    // // Create CAF doc and adding CAF(version 1.0) element
    const cafDoc = create().ele('CAF', { version: '1.0' }).ele(mergedDaFrmaObjects);
    // Parse back to Object
    const cafObject = cafDoc.end({ format: 'object' });

    // Getting keys from Digital Certificates(.pfx) for use in signing
    const publicCert = await fs.readFile(publicCertPath, 'utf8');
    const privateKey = await fs.readFile(privateKeyPath, 'utf8');
    const modulus = await extractModulus();
    const exponent = await extractExponent();

    // Extract Private Key from CAF.xml
    const cafPrivateKey = cafParsedData.AUTORIZACION.RSASK[0];

    let allDtes = '';
    let testObject;
    let testTedXml;
    let digitallySignedTedXml;
    let tedXml;
    let ted;
    let formattedSignedDteXml;
    let Folio = Number(await fs.readFile(folioPath, 'binary'));
    let dtePath;
    for (let i = 0; i < 4; i++) {
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
      ted = {
        DD: {
          RE: RUTEmisor,
          TD: TipoDTE,
          F: Folio,
          FE: FchEmis,
          RR: RUTRecep,
          RSR: RznSocRecep,
          MNT: MntTotal,
          IT1: detalleObject[0].DscItem,
        },
      };
      // FRMA: 'Firma Digital (RSA) del SII Sobre DA', base="xs:base64Binary", name="algoritmo", type="xs:string", use="required", fixed="SHA1withRSA",
      ted.DD.CAF = cafObject.CAF;
      ted.DD.TSTED = TSTED;

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

      // Create a document out of the ted object with CAF inserted
      const tedString = create().ele(ted).toString();
      // Convert node into its string representation
      // const tedString = tedDoc.toString();
      // Create signer
      const tedSigner = crypto.createSign('RSA-SHA256').update(tedString);
      // Update the Sign content with Ted string
      // tedSigner.update(tedString);
      const tedSignature = tedSigner.sign(cafPrivateKey, 'base64');
      const signedTedString = '<TED version="1.0">' + tedString + `<FRMT algoritmo="SHA1withRSA">${tedSignature}</FRMT></TED>`;

      const signedTedObject = create().ele(signedTedString).end({ format: 'object' });

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      const dteTedObject = { ...dteClientData, ...signedTedObject, TmstFirma: TSTED };
      // Create a DTE (Documento Tributario Electrónico) document
      const dteDocumentBuilder = create({ version: '1.0', encoding: 'ISO-8859-1' })
        // Add the root element 'DTE' with its version attribute
        .ele('DTE', { version: '1.0' })
        // Add the 'Documento' element including RUTEmisor, TipoDTE and Folio
        .ele('Documento', { ID: `DTE_${RUTEmisor.slice(0, RUTEmisor.indexOf('-'))}_T${TipoDTE}_F${Folio}` })
        // Include the client-specific details into the 'Documento' element.
        .ele(dteTedObject);
      // Convert the built document structure into a formatted XML string.
      const dteXml = dteDocumentBuilder.end({ prettyPrint: true });

      // Sign DTE with private key and certificate targetting the 'Documento' element
      const signedDteXml = await signXml('Documento', dteXml, privateKey, publicCert, modulus, exponent);
      const signedDteObject = convert({ encoding: 'UTF-8' }, signedDteXml, { format: 'object' });
      const signedDteString = create().ele(signedDteObject).toString();
      // const stringDte = signedDteXml.toString()
      // Parse back into document structure then re-serialize to get propper formatting
      allDtes += signedDteString;
      formattedSignedDteXml = create({ version: '1.0', encoding: 'ISO-8859-1' }).ele(signedDteXml).end({ prettyPrint: true });
      // Save the reformatted, signed DTE XML document to the file system for storage or further processing.
      await fs.writeFile(dtePath, formattedSignedDteXml);

      Folio++;
    }

    // const signedDteObject = create().ele(digitallySignedTedXml);
    // console.log(digitallySignedTedXml);

    // console.log(digitallySignedTedXml);
    // console.log('............');
    // console.log(allDtes);
    allDtes = '<master>' + allDtes + '</master>';
    // const allDteDoc = create().ele(allDtes).end({ prettyPrint: true });
    // console.log(allDteDoc);
    runServer(excelDataObject[0], testObject, allDtes);
  } catch (error) {
    console.log(`XML build has failed: ${error}`);
  }
}
buildClientDte();

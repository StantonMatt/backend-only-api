// 'use strict';

// const { chilkatExample } = require('./chilkat.js');

// const crypto = require('crypto');
// const fs = require('fs-extra');
// const path = require('path');
// const FormData = require('form-data');
// const { create, convert } = require('xmlbuilder2');
// const { signXml } = require('./xml-signer.js');
// const { extractModulus, extractExponent } = require('./extract-keys.js');
// const { getClientData } = require('./database.js');
// const { runServer } = require('./server.js');
// const { getTodayDteFormattedDate, getExpiryDteFormattedDate, getTedFormattedTimeStamp } = require('./util-date.js');
// const folioPath = path.join(__dirname, 'assets', 'folio_disponible.txt');
// const cafPath = path.join(__dirname, 'assets', 'CAFCOAB.xml');
// const privateKeyPath = path.join(__dirname, 'temp', 'output', 'private_key.pem');
// const publicCertPath = path.join(__dirname, 'temp', 'output', 'certificate.pem');

// const sobrePath = path.join(__dirname, 'sobre.xml');

// let dteClientData;

// function addDetalle(detalleObjectArray, NroLinDet, QtyItem, UnmdItem) {
//   detalleObjectArray.forEach(detalle => {
//     dteClientData.Detalle.push({
//       NroLinDet: NroLinDet++,
//       NmbItem: detalle.NmbItem,
//       DscItem: detalle.DscItem,
//       QtyItem: detalle.NmbItem === 'Cargo Fijo' ? 1 : QtyItem,
//       UnmdItem: detalle.NmbItem === 'Cargo Fijo' ? null : UnmdItem,
//       PrcItem: detalle.PrcItem,
//       MontoItem: detalle.MontoItem,
//     });
//   });
// }

// function addDscRcg(dscRcgObject, NroLinDR) {
//   dscRcgObject.forEach(dscRcg => {
//     if (dscRcg.ValorDR) {
//       dteClientData.DscRcgGlobal.push({
//         NroLinDR: NroLinDR++,
//         TpoMov: dscRcg.TpoMov,
//         GlosaDR: dscRcg.GlosaDR,
//         TpoValor: dscRcg.TpoValor,
//         ValorDR: dscRcg.ValorDR,
//         IndExeDR: dscRcg.IndExeDR,
//       });
//     }
//   });
// }

// async function buildClientDte() {
//   try {
//     const excelDataObject = await getClientData();
//     ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//     ////////////////////////////////////////////////FIXED DATA//////////////////////////////////////////////////////

//     let nroTotalBoletas = 0;
//     for (const [_, number] of excelDataObject.entries()) {
//       nroTotalBoletas++;
//       if (!number.Numero) break;
//     }
//     const nroMaxBoletasPorSobre = 50;
//     const RUTEmisor = String(excelDataObject[0].RUTEmisor).toUpperCase().trim();
//     const RznSocEmisor = 'COOPERATIVA DE SERVICIO DE ABASTECIMIENTO Y DISTRIBUCION DE AGUA POTABLE ALCANTARILLADO Y SANEAMIENT';
//     const GiroEmisor = 'CAPTACION, TRATAMIENTO Y DISTRIBUCION DE AGUA';
//     const TipoDTE = 39;
//     const IndServicio = 2;
//     const RUTProvSW = String(excelDataObject[0].RUTEmisor).toUpperCase().trim();
//     const RutEnvia = '5657540-5';
//     const RutReceptor = '60803000-K';
//     const FchResol = '2020-12-30';
//     const NroResol = 0;
//     const TmstFirmaEnv = getTedFormattedTimeStamp();
//     const TpoDTE = TipoDTE;
//     let NroDTE = nroTotalBoletas - nroMaxBoletasPorSobre > 0 ? nroMaxBoletasPorSobre : nroTotalBoletas;

//     let dteSobreObject = {
//       Caratula: {
//         '@version': '1.0',
//         RutEmisor: RUTEmisor,
//         RutEnvia,
//         RutReceptor,
//         FchResol,
//         NroResol,
//         TmstFirmaEnv,
//         SubTotDTE: {
//           TpoDTE,
//           NroDTE,
//         },
//       },
//       DTE: [],
//     };

//     // Read the CAF.xml file as utf8
//     const cafFileContents = await fs.readFile(cafPath, 'utf8');
//     // Parse CafFileContents to Object
//     const cafFileObject = create(cafFileContents).end({ format: 'object' });
//     // Create cafObject from the CAF section
//     const cafObject = { CAF: cafFileObject.AUTORIZACION.CAF };

//     // Getting keys from Digital Certificates(.pfx) for use in signing
//     const publicCert = await fs.readFile(publicCertPath, 'utf8');
//     const privateKey = await fs.readFile(privateKeyPath, 'utf8');
//     const modulus = await extractModulus();
//     const exponent = await extractExponent();

//     // Extract Private Key from CAF.xml
//     const cafPrivateKey = cafFileObject.AUTORIZACION.RSASK;

//     let Folio = Number(await fs.readFile(folioPath, 'binary'));
//     let dtePath;
//     for (let i = 0; i < 4; i++) {
//       // console.log(nroTotalBoletas);

//       dtePath = path.join(__dirname, 'temp', 'output', 'dtes', `dte${i}.xml`);

//       ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//       //////////////////////////////////////////////////////DATA//////////////////////////////////////////////////////
//       const TSTED = getTedFormattedTimeStamp();

//       let NroLinDR = 1;
//       let NroLinDet = 1;

//       const FchEmis = getTodayDteFormattedDate();
//       const FchVenc = getExpiryDteFormattedDate();

//       const RUTRecep = String(excelDataObject[i].RUTRecep).toUpperCase().trim();
//       const CdgIntRecep = String(excelDataObject[i].CdgIntRecep).trim();
//       const RznSocRecep = String(excelDataObject[i].RznSocRecep).split(/\s+/).join(' ').trim();
//       // const Contacto = String(excelDataObject[i].contacto).trim();
//       const DirRecep = String(excelDataObject[i].DirRecep).split(/\s+/).join(' ').trim();
//       const CmnaRecep = 'VILCUN';
//       const CiudadRecep = String(excelDataObject[i].CiudadRecep).split(/\s+/).join(' ').trim();

//       const MntNeto = Number(excelDataObject[i].MntNeto);
//       const IVA = Number(excelDataObject[i].IVA);
//       const MntTotal = Number(excelDataObject[i].MntTotal);
//       const SaldoAnterior = Number(excelDataObject[i].SaldoAnterior);
//       const VlrPagar = Number(excelDataObject[i].VlrPagar);

//       const Descuento = Number(excelDataObject[i].Descuento);
//       const Subsidio = Number(excelDataObject[i].Subsidio);
//       const Repactacion = Number(excelDataObject[i].Repactacion);
//       const Reposicion = Number(excelDataObject[i].Reposicion);
//       const Multa = Number(excelDataObject[i].Multa);
//       const Otros = Number(excelDataObject[i].Otros);

//       const QtyItem = Number(excelDataObject[i].ConsumoM3);
//       const UnmdItem = 'M3';
//       const detalleObject = [
//         {
//           NmbItem: 'Agua',
//           DscItem: 'Consumo de Agua Potable',
//           PrcItem: Number(excelDataObject[i].CostoM3Agua),
//           MontoItem: Number(excelDataObject[i].CostoTotalAgua),
//         },
//         {
//           NmbItemo: 'Alcantarillado',
//           DscItem: 'Recoleccion de Aguas Servidas',
//           PrcItem: Number(excelDataObject[i].CostoM3Alcantarillado),
//           MontoItem: Number(excelDataObject[i].CostoTotalAlcantarillado),
//         },
//         {
//           NmbItem: 'Tratamiento',
//           DscItem: 'Tratamiento de Aguas Servidas',
//           PrcItem: Number(excelDataObject[i].CostoM3Tratamiento),
//           MontoItem: Number(excelDataObject[i].CostoTotalTratamiento),
//         },
//         {
//           NmbItem: 'Cargo Fijo',
//           DscItem: 'Cargo Fijo',
//           PrcItem: Number(excelDataObject[i].CargoFijo),
//           MontoItem: Number(excelDataObject[i].CargoFijo),
//         },
//       ];

//       const dscRcgObject = [
//         { TpoMov: 'D', GlosaDR: 'Descuento', TpoValor: '$', ValorDR: Descuento },
//         { TpoMov: 'D', GlosaDR: 'Subsidio', TpoValor: '$', ValorDR: Subsidio, IndExeDR: 1 },
//         { TpoMov: 'R', GlosaDR: 'Repactacion', TpoValor: '$', ValorDR: Repactacion, IndExeDR: 1 },
//         { TpoMov: 'R', GlosaDR: 'Reposicion', TpoValor: '$', ValorDR: Reposicion },
//         { TpoMov: 'R', GlosaDR: 'Multa', TpoValor: '$', ValorDR: Multa },
//         { TpoMov: 'R', GlosaDR: 'Otros', TpoValor: '$', ValorDR: Otros },
//       ];

//       //////////////////////////////////////////////////////////////////////////////////
//       /////////////////////////////////CLIENT TED JSON//////////////////////////////////
//       const ted = {
//         DD: {
//           RE: RUTEmisor,
//           TD: TipoDTE,
//           F: Folio,
//           FE: FchEmis,
//           RR: RUTRecep,
//           RSR: RznSocRecep,
//           MNT: MntTotal,
//           IT1: detalleObject[0].DscItem,
//           CAF: cafObject.CAF,
//           TSTED,
//         },
//       };
//       // ted.DD.CAF = cafObject.CAF;
//       // ted.DD.TSTED = TSTED;

//       //////////////////////////////////////////////////////////////////////////////////
//       /////////////////////////////////CLIENT DTE JSON//////////////////////////////////
//       dteClientData = {
//         Encabezado: {
//           IdDoc: {
//             TipoDTE,
//             Folio,
//             FchEmis,
//             IndServicio,
//             FchVenc,
//           },
//           Emisor: {
//             RUTEmisor,
//             RznSocEmisor,
//             GiroEmisor,
//           },
//           Receptor: {
//             RUTRecep,
//             CdgIntRecep,
//             RznSocRecep,
//             // Contacto,
//             DirRecep,
//             CmnaRecep,
//             CiudadRecep,
//           },
//           Totales: {
//             MntNeto,
//             IVA,
//             MntTotal,
//             SaldoAnterior,
//             VlrPagar,
//           },
//         },
//         Detalle: [],
//         DscRcgGlobal: [],
//       };
//       addDetalle(detalleObject, NroLinDet, QtyItem, UnmdItem);
//       addDscRcg(dscRcgObject, NroLinDR);

//       // Create a Document out of the ted object and parse to String
//       const tedString = create().ele(ted).toString();
//       // Create signer to sign tedString and update it with content to sign(tedString)
//       const tedSigner = crypto.createSign('RSA-SHA256').update(tedString);
//       // Sign the String and get the Signature
//       const tedSignature = tedSigner.sign(cafPrivateKey, 'base64');
//       // Recreate the XML as a String, including the Signature
//       const signedTedString = '<TED version="1.0">' + tedString + `<FRMT algoritmo="SHA1withRSA">${tedSignature}</FRMT></TED>`;
//       // Create a Document out of the signedTedString and parse to Object
//       const signedTedObject = create().ele(signedTedString).end({ format: 'object' });

//       //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//       //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//       // Combine DTE Client Object with TED Object and add a Timestamp to the end
//       const dteObject = { ...dteClientData, ...signedTedObject, TmstFirma: TSTED };
//       // Create a DTE Document from the combined data
//       const dteDoc = create({ version: '1.0', encoding: 'ISO-8859-1' })
//         // Add the root element 'DTE' with its version attribute
//         .ele('DTE', { version: '1.0' })
//         // Add the 'Documento' element including RUTEmisor, TipoDTE and Folio
//         .ele('Documento', { ID: `DTE_${RUTEmisor.slice(0, RUTEmisor.indexOf('-'))}_T${TipoDTE}_F${Folio}` })
//         // Add the dteObject data
//         .ele(dteObject);
//       // Convert the built document structure into a formatted XML string.
//       const dteXml = dteDoc.end();

//       // Sign DTE with private key and certificate targetting the 'Documento' element
//       const signedDteXml = await signXml({
//         xml: dteXml,
//         modulus,
//         exponent,
//         privateKey,
//         publicCert,
//         canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
//         signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
//         references: {
//           xpath: `//*[local-name(.)='Documento']`,
//           digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
//           transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
//         },
//       });
//       // Parse the signedDteXml to an Object
//       const signedDteObject = convert({ encoding: 'ISO-8859-1' }, signedDteXml, { format: 'object' });

//       // Push all signed DTE Objects into the Sobre Object
//       dteSobreObject.DTE.push(signedDteObject.DTE);

//       // // Create a DOC out of the signedDteXml adding required attributes then parse to prettyPrinted XML
//       // const formattedSignedDteXml = create({ version: '1.0', encoding: 'ISO-8859-1' }).ele(signedDteXml).end({ prettyPrint: true });
//       // // Save the reformatted, signed DTE XML document to the file system for storage or further processing.
//       // await fs.writeFile(dtePath, formattedSignedDteXml);

//       Folio++;
//     }

//     // Create Document from the DteSobreObject, addding required attributes
//     const dteSobreDoc = create({ version: '1.0', encoding: 'ISO-8859-1' })
//       .ele('EnvioBOLETA', {
//         // 'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
//         // 'xsi:schemaLocation': 'http://www.sii.cl/SiiDte EnvioBOLETA_v11.xsd',
//         // version: '1.0',
//         xmlns: 'http://www.sii.cl/SiiDte',
//       })
//       .ele('SetDTE', { ID: 'SetDoc' })
//       .ele(dteSobreObject);
//     // Parse the Sobre Doc to prettyPrinted XML format
//     const dteSobreXml = dteSobreDoc.end();
//     // Sign the DteSobreXml according to specs
//     const signedSobreXml = await signXml({
//       xml: dteSobreXml,
//       modulus,
//       exponent,
//       privateKey,
//       publicCert,
//       canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
//       signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
//       references: {
//         xpath: `//*[local-name(.)='SetDTE']`,
//         digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
//         transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
//       },
//     });

//     await fs.writeFile(sobrePath, signedSobreXml);
//     const form = new FormData();
//     form.append('rutSender', RutEnvia.slice(0, RutEnvia.indexOf('-') + 1));
//     form.append('dvSender', RutEnvia.slice(-1));
//     form.append('rutCompany', RUTEmisor.slice(0, RutEnvia.indexOf('-') + 1));
//     form.append('dvCompany', RUTEmisor.slice(-1));
//     form.append('archivo', fs.createReadStream(sobrePath));

//     chilkatExample(signedSobreXml);

//     runServer(excelDataObject[0], {}, signedSobreXml);
//     return form;
//   } catch (error) {
//     console.log(`XML build has failed: ${error}`);
//   }
// }

// module.exports = { buildClientDte };

// 'use strict';

// const fs = require('fs-extra');
// const path = require('path');
// const { create, convert } = require('xmlbuilder2');
// const { getExpiryDteFormattedDate } = require('./util-date.js');
// const { getSheetData, cN } = require('./database.js');
// const { generateCer } = require('./extract-keys.js');
// const paths = require('./paths.js');

// const primerFolioDisponiblePath = paths.getPrimerFolioDisponiblePath();

// const cafPath = paths.getCaf39Path();
// const cafPrivateKeyPath = paths.getCaf39PrivateKeyPath();
// const templatePath = paths.getTemplate39Path();
// const cantidadFoliosEmitidosPath = paths.getCantidadFoliosEmitidosPath();
// const montoNetoBoletasPath = paths.getMontoNetoBoletasPath();
// const montoIvaBoletasPath = paths.getMontoIvaBoletasPath();
// const montoExentoBoletasPath = paths.getMontoExentoBoletasPath();
// const montoTotalBoletasPath = paths.getMontoTotalBoletasPath();

// let dteClientData;

// function addDetalle(detalleObjectArray, nroLinDet) {
//   detalleObjectArray.forEach(detalle => {
//     dteClientData.Detalle.push({
//       NroLinDet: nroLinDet++,
//       IndExe: detalle.indExe,
//       NmbItem: detalle.nmbItem,
//       QtyItem: detalle.qtyItem,
//       UnmdItem: detalle.unmdItem,
//       PrcItem: detalle.prcItem,
//       MontoItem: detalle.montoItem,
//     });
//   });
// }

// function addDscRcg(dscRcgObject, nroLinDR) {
//   dscRcgObject.forEach(dscRcg => {
//     if (dscRcg.ValorDR) {
//       dteClientData.DscRcgGlobal.push({
//         NroLinDR: nroLinDR++,
//         TpoMov: dscRcg.tpoMov,
//         GlosaDR: dscRcg.glosaDR,
//         TpoValor: dscRcg.tpoValor,
//         ValorDR: dscRcg.valorDR,
//         IndExeDR: dscRcg.indExeDR,
//       });
//     }
//   });
// }

// async function buildClientDte() {
//   try {
//     const excelDataObject = await getSheetData('test');

//     // Read the CAF.xml file as utf8
//     const cafFileContents = await fs.readFile(cafPath, 'utf8');
//     // Parse CafFileContents to Object
//     const cafFileObject = create(cafFileContents).end({ format: 'object' });
//     // Create cafObject from the CAF section
//     const cafObject = { CAF: cafFileObject.AUTORIZACION.CAF };

//     // Extract Private Key from CAF.xml
//     let cafPrivateKey = cafFileObject.AUTORIZACION.RSASK;
//     await fs.writeFile(cafPrivateKeyPath, cafPrivateKey);

//     ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//     ////////////////////////////////////////////////FIXED DATA//////////////////////////////////////////////////////

//     let nroTotalBoletas = 0;
//     let montoNetoBoletas = 0;
//     let montoIvaBoletas = 0;
//     let montoExentoBoletas = 0;
//     let montoTotalBoletas = 0;
//     for (const [_, number] of excelDataObject.entries()) {
//       nroTotalBoletas++;
//       if (!number.Numero) break;
//     }

//     const rutEmisor = String(excelDataObject[0]['RUT Empresa']).toUpperCase().trim();
//     const rznSocEmisor = 'AGRICOLA LA FRONTERA LIMITADA';
//     const giroEmisor = 'CULTIVO DE PRODUCTOS AGRICOLAS EN COMBINACION CON LA CRIA DE ANIMALES';
//     const tipoDte = 39;
//     const indServicio = 3;
//     const rutProvSw = rutEmisor;
//     const rutEnvia = '5657540-5';
//     const rutReceptor = '60803000-K';
//     const fchResol = '2024-04-08';
//     const nroResol = 0;
//     const fchVenc = getExpiryDteFormattedDate();
//     const fchEmis = '@!FECHA!@';
//     const timeStamp = '@!TIMESTAMP!@';
//     const firmaSig = '@!FRMT-SIG!@';
//     const signature = '@!SIGNATURE!@';
//     const nroDte = '@!NUM-DTE!@';
//     const dteSet = '@!SET-OF-DTE!@';

//     let folio = Number(await fs.readFile(primerFolioDisponiblePath, 'binary'));
//     let dtePath;
//     const nroBoletas = 5;
//     for (let i = 0; i < nroBoletas; i++) {
//       dtePath = path.join(__dirname, 'assets', 'output', 'boletas', 'dtes', 'unsigned', `dte${i + 1}.xml`);

//       ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//       //////////////////////////////////////////////////////DATA//////////////////////////////////////////////////////
//       let nroLinDR = 1;
//       let nroLinDet = 1;
//       let nroLinRef = 1;

//       const codRef = String(excelDataObject[i][cN().codRef]).trim();
//       const razonRef = String(excelDataObject[i][cN().razonRef]).trim();

//       const nmbItem1 = excelDataObject[i][cN().nmbItem1] ? String(excelDataObject[i][cN().nmbItem1]).split(/\s+/).join(' ').trim() : undefined;
//       const nmbItem2 = excelDataObject[i][cN().nmbItem2] ? String(excelDataObject[i][cN().nmbItem2]).split(/\s+/).join(' ').trim() : undefined;

//       const dscItem1 = excelDataObject[i][cN().dscItem1] ? String(excelDataObject[i][cN().dscItem1]).split(/\s+/).join(' ').trim() : undefined;
//       const dscItem2 = excelDataObject[i][cN().dscItem2] ? String(excelDataObject[i][cN().dscItem2]).split(/\s+/).join(' ').trim() : undefined;

//       const qtyItem1 = Number(excelDataObject[i][cN().qtyItem1]);
//       const qtyItem2 = Number(excelDataObject[i][cN().qtyItem2]);

//       const unmdItem1 = excelDataObject[i][cN().unmdItem1]
//         ? String(excelDataObject[i][cN().unmdItem1]).split(/\s+/).join(' ').trim()
//         : undefined;
//       const unmdItem2 = excelDataObject[i][cN().unmdItem2]
//         ? String(excelDataObject[i][cN().unmdItem2]).split(/\s+/).join(' ').trim()
//         : undefined;

//       const prcItem1 = Number(excelDataObject[i][cN().prcItem1]);
//       const prcItem2 = Number(excelDataObject[i][cN().prcItem2]);

//       const montoItem1 = Number(excelDataObject[i][cN().montoItem1]);
//       const montoItem2 = Number(excelDataObject[i][cN().montoItem2]);

//       let indExe1 = nmbItem1 && nmbItem1.includes('exento') ? 1 : null;
//       let indExe2 = nmbItem2 && nmbItem2.includes('exento') ? 1 : null;

//       const rutRecep = String(excelDataObject[i][cN().rutRecep]).toUpperCase().trim();
//       const cdgIntRecep = String(excelDataObject[i][cN().cdgIntRecep]).trim();
//       const rznSocRecep = String(excelDataObject[i][cN().rznSocRecep]).split(/\s+/).join(' ').trim();
//       // const Contacto = String(excelDataObject[i][cN().correo]).trim();
//       const dirRecep = String(excelDataObject[i][cN().dirRecep]).split(/\s+/).join(' ').trim();
//       const cmnaRecep = 'VILCUN';
//       const ciudadRecep = String(excelDataObject[i][cN().ciudadRecep]).split(/\s+/).join(' ').trim();

//       const mntNeto = Number(excelDataObject[i][cN().mntNeto]);
//       const iva = Number(excelDataObject[i][cN().iva]);
//       const mntTotal = Number(excelDataObject[i][cN().mntTotal]);
//       const mntExe = excelDataObject[i][cN().mntExe] ? Number(excelDataObject[i][cN().mntExe]) : null;
//       const saldoAnterior = Number(excelDataObject[i][cN().saldoAnterior]);
//       const vlrPagar = Number(excelDataObject[i][cN().vlrPagar]);

//       const descuento = Number(excelDataObject[i][cN().descuento]);
//       const subsidio = Number(excelDataObject[i][cN().subsidio]);
//       const repactacion = Number(excelDataObject[i][cN().repactacion]);
//       const reposicion = Number(excelDataObject[i][cN().reposicion]);
//       const multa = Number(excelDataObject[i][cN().multa]);

//       const qtyItem = Number(excelDataObject[i][cN().consumoM3]);

//       const detalleObject = [];

//       montoNetoBoletas += mntNeto;
//       montoIvaBoletas += iva;
//       montoExentoBoletas += mntExe;
//       montoTotalBoletas += mntTotal;

//       if (nmbItem1) {
//         detalleObject.push({
//           indExe: indExe1,
//           nmbItem: nmbItem1,
//           dscItem: dscItem1,
//           qtyItem: qtyItem1,
//           unmdItem: unmdItem1,
//           prcItem: prcItem1,
//           montoItem: montoItem1,
//         });
//       }
//       if (nmbItem2) {
//         detalleObject.push({
//           indExe: indExe2,
//           nmbItem: nmbItem2,
//           dscItem: dscItem2,
//           qtyItem: qtyItem2,
//           unmdItem: unmdItem2,
//           prcItem: prcItem2,
//           montoItem: montoItem2,
//         });
//       }

//       // //////////////////////////////////////////////////////////////////////////////////
//       // /////////////////////////////////CLIENT DTE JSON//////////////////////////////////
//       dteClientData = {
//         Encabezado: {
//           IdDoc: {
//             TipoDTE: tipoDte,
//             Folio: folio,
//             FchEmis: fchEmis,
//             IndServicio: indServicio,
//             FchVenc: fchVenc,
//           },
//           Emisor: {
//             RUTEmisor: rutEmisor,
//             RznSocEmisor: rznSocEmisor,
//             GiroEmisor: giroEmisor,
//           },
//           Receptor: {
//             RUTRecep: rutRecep,
//             RznSocRecep: rznSocRecep,
//             DirRecep: dirRecep,
//             CmnaRecep: cmnaRecep,
//             CiudadRecep: ciudadRecep,
//           },
//           Totales: {
//             MntNeto: mntNeto,
//             MntExe: mntExe,
//             IVA: iva,
//             MntTotal: mntTotal,
//           },
//         },
//         Detalle: [],
//         DscRcgGlobal: [],
//         Referencia: {
//           NroLinRef: nroLinRef,
//           CodRef: codRef,
//           RazonRef: razonRef,
//         },
//         // RUTProvSW,
//       };
//       addDetalle(detalleObject, nroLinDet);

//       //////////////////////////////////////////////////////////////////////////////////
//       /////////////////////////////////CLIENT TED JSON//////////////////////////////////
//       const ted = {
//         DD: {
//           RE: rutEmisor,
//           TD: tipoDte,
//           F: folio,
//           FE: fchEmis,
//           RR: rutRecep,
//           RSR: rznSocRecep,
//           MNT: mntTotal,
//           IT1: detalleObject[0].nmbItem,
//           CAF: cafObject.CAF,
//           TSTED: timeStamp,
//         },
//         FRMT: { '@algoritmo': 'SHA1withRSA', '#': firmaSig },
//       };

//       // Create a Document out of the signedTedString and parse to Object
//       const tedObject = create().ele('TED', { version: '1.0' }).ele(ted).end({ format: 'object' });

//       // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//       // //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//       // Combine DTE Client Object with TED Object and add a Timestamp to the end
//       const dteObject = { ...dteClientData, ...tedObject };
//       // Create a DTE Document from the combined data
//       const dteDoc = create()
//         // Add the root element 'DTE' with its version attribute
//         .ele('DTE', { version: '1.0' })
//         // Add the 'Documento' element including RUTEmisor, TipoDTE and Folio
//         .ele('Documento', { ID: `F${folio}_T${tipoDte}` })
//         // Add the dteObject data
//         .ele(dteObject)
//         .up()
//         .ele('TmstFirma')
//         .txt(timeStamp)
//         .up()
//         .up()
//         .ele('Signature')
//         .txt(signature);
//       // Convert the built document structure into a formatted XML string.
//       const dteXml = dteDoc.end({ prettyPrint: true }).replace('<?xml version="1.0"?>\n', '');
//       await fs.writeFile(dtePath, dteXml);

//       folio++;
//       nroLinRef++;
//     }

//     // Create Document from the DteSobreObject, addding required attributes
//     const dteSobreDoc = create({ version: '1.0', encoding: 'ISO-8859-1' })
//       .ele('EnvioBOLETA', {
//         'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
//         'xsi:schemaLocation': 'http://www.sii.cl/SiiDte EnvioBOLETA_v11.xsd',
//         xmlns: 'http://www.sii.cl/SiiDte',
//         version: '1.0',
//       })
//       .ele('SetDTE', { ID: 'SetDoc' })
//       .ele('Caratula', { version: '1.0' })
//       .ele('RutEmisor')
//       .txt(rutEmisor)
//       .up()
//       .ele('RutEnvia')
//       .txt(rutEnvia)
//       .up()
//       .ele('RutReceptor')
//       .txt(rutReceptor)
//       .up()
//       .ele('FchResol')
//       .txt(fchResol)
//       .up()
//       .ele('NroResol')
//       .txt(nroResol)
//       .up()
//       .ele('TmstFirmaEnv')
//       .txt(timeStamp)
//       .up()
//       .ele('SubTotDTE')
//       .ele('TpoDTE')
//       .txt(tipoDte)
//       .up()
//       .ele('NroDTE')
//       .txt(nroDte)
//       .up()
//       .up()
//       .up()
//       .ele('DTE')
//       .txt(dteSet)
//       .up()
//       .up()
//       .ele('Signature')
//       .txt(signature);

//     // Parse the Sobre Doc to prettyPrinted XML format
//     const dteSobreXml = dteSobreDoc.end({ prettyPrint: true });

//     await fs.writeFile(templatePath, dteSobreXml);
//     await fs.writeFile(cantidadFoliosEmitidosPath, String(nroBoletas));
//     await fs.writeFile(montoNetoBoletasPath, String(montoNetoBoletas));
//     await fs.writeFile(montoIvaBoletasPath, String(montoIvaBoletas));
//     await fs.writeFile(montoExentoBoletasPath, String(montoExentoBoletas));
//     await fs.writeFile(montoTotalBoletasPath, String(montoTotalBoletas));

//     // runServer(excelDataObject[0], {}, signedSobreXml);
//     await generateCer();
//   } catch (error) {
//     console.log(`XML build has failed: ${error}`);
//   }
// }

// module.exports = { buildClientDte };

'use strict';

const fs = require('fs-extra');
const path = require('path');
const { create } = require('xmlbuilder2');
const { getClientData } = require('./database.js');
const { runServer } = require('./server.js');
const { getTodayDteFormattedDate, getExpiryDteFormattedDate } = require('./util.js');

const folioPath = path.join(__dirname, 'assets', 'folio_disponible.txt');

const TipoDTE = 39;
const IndServicio = 2;
const RznSocEmisor =
  'COOPERATIVA DE SERVICIO DE ABASTECIMIENTO Y DISTRIBUCION DE AGUA POTABLE ALCANTARILLADO Y SANEAMIENT';
const GiroEmisor = 'Prestación de servicios sanitarios';
const CmnaRecep = 'VILCUN';
let dteCliente;

function addDscRcg(NroLinDR, TpoMov, GlosaDR, TpoValor, ValorDR, IndExeDR) {
  console.log(ValorDR);
  dteCliente.DTE.Documento.DscRcgGlobal.push({
    NroLinDR,
    TpoMov,
    GlosaDR,
    TpoValor,
    ValorDR,
    IndExeDR,
  });
}

async function buildClientDte() {
  try {
    const clientObject = await getClientData();
    let Folio = Number(await fs.readFile(folioPath, 'binary'));
    for (let i = 0; i < 2; i++) {
      const dtePath = path.join(__dirname, 'assets', 'temp', 'output', 'dtes', `dte${i}`);
      let NroLinDR = 1;
      dteCliente = {
        DTE: {
          Documento: {
            Encabezado: {
              IdDoc: {
                TipoDTE,
                Folio: Folio++,
                FchEmis: getTodayDteFormattedDate().trim(),
                IndServicio,
                FchVenc: getExpiryDteFormattedDate().trim(),
              },
              Emisor: {
                RUTEmisor: String(clientObject[0].RUTEmisor).toUpperCase().trim(),
                RznSocEmisor,
                GiroEmisor,
              },
              Receptor: {
                RUTRecep: String(clientObject[i].RUTRecep).toUpperCase().trim(),
                CdgIntRecep: String(clientObject[i].CdgIntRecep).trim(),
                RznSocRecep: String(clientObject[i].RznSocRecep)
                  .split(/\s+/)
                  .join(' ')
                  .trim(),
                // Contacto: String(clientObject[i].contacto).trim(),
                DirRecep: String(clientObject[i].DirRecep).split(/\s+/).join(' ').trim(),
                CmnaRecep,
                CiudadRecep: String(clientObject[i].CiudadRecep)
                  .split(/\s+/)
                  .join(' ')
                  .trim(),
              },
              RUTProvSW: String(clientObject[0].RUTEmisor).toUpperCase().trim(),
              Totales: {
                MntNeto: Number(clientObject[i].MntNeto),
                IVA: Number(clientObject[i].IVA),
                MntTotal: Number(clientObject[i].MntTotal),
                SaldoAnterior: Number(clientObject[i].SaldoAnterior),
                VlrPagar: Number(clientObject[i].VlrPagar),
              },
            },
            Detalle: [
              {
                NroLinDet: 1,
                NmbItem: 'Agua',
                DscItem: 'Consumo de Agua Potable',
                QtyItem: Number(clientObject[i].ConsumoM3),
                UnmdItem: 'Metros Cubicos',
                PrcItem: Number(clientObject[i].CostoM3Agua),
                MontoItem: Number(clientObject[i].CostoTotalAgua),
              },
              {
                NroLinDet: 2,
                NmbItem: 'Alcantarillado',
                DscItem: 'Recoleccion de Aguas Servidas',
                QtyItem: Number(clientObject[i].ConsumoM3),
                UnmdItem: 'Metros Cubicos',
                PrcItem: Number(clientObject[i].CostoM3Alcantarillado),
                MontoItem: Number(clientObject[i].CostoTotalAlcantarillado),
              },
              {
                NroLinDet: 3,
                NmbItem: 'Tratamiento',
                DscItem: 'Tratamiento de Aguas Servidas',
                QtyItem: Number(clientObject[i].ConsumoM3),
                UnmdItem: 'Metros Cubicos',
                PrcItem: Number(clientObject[i].CostoM3Tratamiento),
                MontoItem: Number(clientObject[i].CostoTotalTratamiento),
              },
              {
                NroLinDet: 4,
                NmbItem: 'Cargo Fijo',
                QtyItem: 1,
                PrcItem: Number(clientObject[i].CargoFijo),
                MontoItem: Number(clientObject[i].CargoFijo),
              },
            ],
            DscRcgGlobal: [],
          },
        },
      };
      const Descuento = Number(clientObject[i].Descuento);
      if (Descuento) {
        addDscRcg(NroLinDR++, 'D', 'Descuento', '$', Descuento);
      }
      const Subsidio = Number(clientObject[i].Subsidio);
      if (Subsidio) {
        addDscRcg(NroLinDR++, 'D', 'Subsidio', '$', Subsidio, 1);
      }
      const Repactacion = Number(clientObject[i].Repactacion);
      if (Repactacion) {
        addDscRcg(NroLinDR++, 'R', 'Repactacion', '$', Repactacion, 1);
      }
      const Reposicion = Number(clientObject[i].Reposicion);
      if (Reposicion) {
        addDscRcg(NroLinDR++, 'R', 'Reposicion de Servicio', '$', Reposicion);
      }
      const Multa = Number(clientObject[i].Multa);
      if (Multa) {
        addDscRcg(NroLinDR++, 'R', 'Multa', '$', Multa);
      }
      const Otros = Number(clientObject[i].Otros);
      if (Otros) {
        addDscRcg(NroLinDR++, 'R', 'Otros', '$', Otros);
      }
    }
    const doc = create({ version: '1.0', encoding: 'ISO-8859-1' }).ele(dteCliente);
    const xmlString = doc.end({ prettyPrint: true });
    console.log(xmlString);
    runServer(clientObject[0], dteCliente, xmlString);
  } catch (error) {
    console.log(`XML build has failed: ${error}`);
  }
}
buildClientDte();

// TED: {
//   DD: {
//     RE: '12345678-9',
//     TD: 39,
//     F: 123456,
//     FE: '2024-03-27',
//     RR: '98765432-1',
//     RSR: 'María Rivera',
//     MNT: 10000,
//     IT1: 'Abastecimiento de Agua Potable',
//     CAF: {
//       DA: {
//         RE: '12345678-9',
//         RS: 'COOPERATIVA DE SERVICIO DE ABASTECIMIENT',
//         TD: 39,
//         RNG: {
//           D: 2645,
//           H: 22644,
//         },
//         FA: '2024-03-27',
//         RSAPK: {
//           M: 'Clave Publica RSA del Solicitante: Modulo RSA',
//           E: 'Clave Publica RSA del Solicitante: Exponente RSA',
//         },
//         IDK: 100,
//       },
//       // FRMA: 'Firma Digital (RSA) del SII Sobre DA', base="xs:base64Binary", name="algoritmo", type="xs:string", use="required", fixed="SHA1withRSA",
//     },
//     TSTED: '2024-03-27T12:00:00',
//   },
//   // FRMT: { "Valor de Firma Digital  sobre DD"
//   //   algoritmo: 'SHA1withRSA',
//   //   valor: 'xxxx',
//   // },
// },
// TmstFirma: 'AAAA-MM-DDTHH:MI:SS',

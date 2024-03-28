const fs = require('fs-extra');
const path = require('path');
const { create } = require('xmlbuilder2');
const { getClientData } = require('./database.js');
const { runServer } = require('./server.js');

const folioPath = path.join(__dirname, 'assets', 'folio_disponible.txt');
const TipoDTE = 39;

async function buildClientDte() {
  try {
    const clientObject = await getClientData();
    let Folio = Number(await fs.readFile(folioPath, 'binary'));
    console.log(Folio);
    for (let i = 0; i < 1; i++) {
      DTE = {
        Documento: {
          Encabezado: {
            IdDoc: {
              TipoDTE,
              Folio,
              FchEmis: '2024-03-27',
              IndServicio: 2,
              // IndMntNeto: 2,
              FchVenc: '2024-04-20',
            },
            Emisor: {
              RUTEmisor: '12345678-9',
              RznSocEmisor:
                'COOPERATIVA DE SERVICIO DE ABASTECIMIENTO Y DISTRIBUCION DE AGUA POTABLE ALCANTARILLADO Y SANEAMIENT',
              GiroEmisor: 'Prestación de servicios sanitarios',
            },
            Receptor: {
              RUTRecep: '98765432-1',
              CdgIntRecep: '110070',
              RznSocRecep: 'María Rivera',
              Contacto: 'maria.rivera@example.com',
              DirRecep: 'Las Araucarias 1234',
              CmnaRecep: 'Vilcun',
              CiudadRecep: 'General Lopez',
            },
            RUTProvSW: 'rutemisor',
            Totales: {
              MntNeto: 8900,
              IVA: 1100,
              MntTotal: 10000,
              SaldoAnterior: 5555,
              VlrPagar: 15555,
            },
          },
          Detalle: [
            {
              NroLinDet: 1,
              NmbItem: 'Agua',
              DscItem: 'Consumo de Agua Potable',
              QtyItem: 15,
              UnmdItem: 'Metros Cubicos',
              PrcItem: 470,
              MontoItem: 7050,
            },
            {
              NroLinDet: 2,
              NmbItem: 'Alcantarillado',
              DscItem: 'Recoleccion de Aguas Servidas',
              QtyItem: 15,
              UnmdItem: 'Metros Cubicos',
              PrcItem: 470,
              MontoItem: 7050,
            },
            {
              NroLinDet: 3,
              NmbItem: 'Tratamiento',
              DscItem: 'Tratamiento de Aguas Servidas',
              QtyItem: 15,
              UnmdItem: 'Metros Cubicos',
              PrcItem: 290,
              MontoItem: 4350,
            },
            {
              NroLinDet: 4,
              NmbItem: 'Cargo Fijo',
              QtyItem: 1,
              PrcItem: 1500,
              MontoItem: 5500,
            },
          ],
          // DscRcgGlobal: [
          //   {
          //     NroLinDR: 1,
          //     TpoMov: 'D(descuento) o R(recarga)',
          //     GlosaDR: 'Descripcion del Descuento o Recargo',
          //     TpoValor: '%(porcentaje) o $(monto)',
          //     ValorDR: 5,
          //   },
          // ],
        },
      };
    }
    runServer(DTE);
  } catch (error) {
    console.log(error);
  }
}
buildClientDte();

const DTE = {
  Documento: {
    Encabezado: {
      IdDoc: {
        TipoDTE: 39,
        Folio: 123456,
        FchEmis: '2024-03-27',
        IndServicio: 2,
        // IndMntNeto: 2,
        FchVenc: '2024-04-20',
      },
      Emisor: {
        RUTEmisor: '12345678-9',
        RznSocEmisor:
          'COOPERATIVA DE SERVICIO DE ABASTECIMIENTO Y DISTRIBUCION DE AGUA POTABLE ALCANTARILLADO Y SANEAMIENT',
        GiroEmisor: 'Prestación de servicios sanitarios',
      },
      Receptor: {
        RUTRecep: '98765432-1',
        CdgIntRecep: '110070',
        RznSocRecep: 'María Rivera',
        Contacto: 'maria.rivera@example.com',
        DirRecep: 'Las Araucarias 1234',
        CmnaRecep: 'Vilcun',
        CiudadRecep: 'General Lopez',
      },
      RUTProvSW: 'rutemisor',
      Totales: {
        MntNeto: 8900,
        IVA: 1100,
        MntTotal: 10000,
        SaldoAnterior: 5555,
        VlrPagar: 15555,
      },
    },
    Detalle: [
      {
        NroLinDet: 1,
        NmbItem: 'Agua',
        DscItem: 'Consumo de Agua Potable',
        QtyItem: 15,
        UnmdItem: 'Metros Cubicos',
        PrcItem: 470,
        MontoItem: 7050,
      },
      {
        NroLinDet: 2,
        NmbItem: 'Alcantarillado',
        DscItem: 'Recoleccion de Aguas Servidas',
        QtyItem: 15,
        UnmdItem: 'Metros Cubicos',
        PrcItem: 470,
        MontoItem: 7050,
      },
      {
        NroLinDet: 3,
        NmbItem: 'Tratamiento',
        DscItem: 'Tratamiento de Aguas Servidas',
        QtyItem: 15,
        UnmdItem: 'Metros Cubicos',
        PrcItem: 290,
        MontoItem: 4350,
      },
      {
        NroLinDet: 4,
        NmbItem: 'Cargo Fijo',
        QtyItem: 1,
        PrcItem: 1500,
        MontoItem: 5500,
      },
    ],
    // DscRcgGlobal: [
    //   {
    //     NroLinDR: 1,
    //     TpoMov: 'D(descuento) o R(recarga)',
    //     GlosaDR: 'Descripcion del Descuento o Recargo',
    //     TpoValor: '%(porcentaje) o $(monto)',
    //     ValorDR: 5,
    //   },
    // ],
  },
};

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

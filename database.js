'use strict';

const XLSX = require('xlsx');
const path = require('path');

const mainFileName = '02-2024 PLANILLA vencto 20-03-2024';
const testFileName = 'test';

async function getSheetData(fileName) {
  try {
    if (fileName === 0) fileName = mainFileName;
    if (fileName === 1) fileName = testFileName;
    const excelDataPath = path.join(__dirname, 'database', fileName + '.xlsx');
    const workbook = XLSX.readFile(excelDataPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    return XLSX.utils.sheet_to_json(worksheet);
  } catch (error) {
    console.error('Error reading the XLSX file:', error);
  }
}

async function getCompanyData() {
  try {
    const excelDataObject = await getSheetData(mainFileName);
    return {
      rutProvSw: String(excelDataObject[0][cN().rutEmisor]).toUpperCase().trim(),
      rutEmisor: String(excelDataObject[0][cN().rutEmisor]).toUpperCase().trim(),
      rutEnvia: String(excelDataObject[0][cN().rutEnvia]).toUpperCase().trim(),
      rutReceptor: String(excelDataObject[0][cN().rutReceptor]).toUpperCase().trim(),
      rznSocEmisor: String(excelDataObject[0][cN().rznSocEmisor]).split(/\s+/).join(' ').trim().slice(0, 100),
      giroEmisor: String(excelDataObject[0][cN().giroEmisor]).split(/\s+/).join(' ').trim().slice(0, 80),
      fchResol: String(excelDataObject[0][cN().fchResol]).toUpperCase().trim(),
      nroResol: excelDataObject[0][cN().nroResol],
      tipoDte: 39,
      indServicio: excelDataObject[0][cN().indServicio],
    };
  } catch (error) {
    console.log(`ERROR: Failed to get company data ${error}`);
  }
}

function cN() {
  return {
    detalleNmbCargoFijo: 'Cargo Fijo',
    detalleDscCargoFijo: 'Costo Fijo Mensual',
    detalleNmbAgua: 'Agua',
    detalleDscAgua: 'Consumo de Agua Potable',
    detalleNmbAlcantarillado: 'Alcantarillado',
    detalleDscAlcantarillado: 'Recoleccion de Aguas Servidas',
    detalleNmbTratamiento: 'Tratamiento',
    detalleDscTratamiento: 'Tratamiento de Aguas Servidas',

    number: 'N#',
    isFactura: 'Recibe Factura',
    rutEmisor: 'RUT Empresa',
    rznSocEmisor: 'Razon Social Empresa',
    giroEmisor: 'Giro Empresa',
    indServicio: 'Indice Servicio',
    fchResol: 'Fecha Resolucion',
    nroResol: 'Numero Resolucion',
    rutEnvia: 'RUT Representante Legal',
    rutReceptor: 'RUT SII',
    numero: 'N#',
    cdgIntRecep: 'Numero Cliente',
    rznSocRecep: 'Nombre',
    dirRecep: 'Direccion',
    cmnaRecep: 'Comuna',
    ciudadRecep: 'Ciudad',
    celular1: 'Celular 1',
    celular2: 'Celular 2',
    correo: 'Correo',
    rutRecep: 'RUT',
    codRef: 'Codigo Referencia',
    razonRef: 'Razon Referencia',
    nmbItem1: 'Producto 1',
    nmbItem2: 'Producto 2',
    dscItem1: 'Descripcion 1',
    dscItem2: 'Descripcion 2',
    qtyItem1: 'Cantidad 1',
    qtyItem2: 'Cantidad 2',
    unmdItem1: 'Unidad Medida 1',
    unmdItem2: 'Unidad Medida 2',
    prcItem1: 'Precio 1',
    prcItem2: 'Precio 2',
    lecturaAnterior: 'Lectura Anterior',
    lecturaActual: 'Lectura Actual',
    consumoM3: 'Consumo M3',
    costoM3Agua: 'Costo M3 Agua',
    costoM3Alcantarillado: 'Costo M3 Alcantarillado',
    costoM3Tratamiento: 'Costo M3 Tratamiento',
    cargoFijo: 'Cargo Fijo',
    costoTotalAgua: 'Costo Total Agua',
    costoTotalAlcantarillado: 'Costo Total Alcantarillado',
    costoTotalTratamiento: 'Costo Total Tratamiento',
    descuento: 'Descuento',
    reposicion: 'Reposicion',
    multa: 'Multa',
    montoItem1: 'Monto 1',
    montoItem2: 'Monto 2',
    mntExe: 'Monto Exento',
    iva: 'IVA',
    mntNeto: 'Monto Neto',
    mntExe: 'Monto Exento',
    mntTotal: 'Total Mes',
    saldoAnterior: 'Saldo Anterior',
    subsidio: 'Subsidio',
    repactacion: 'Repactacion',
    vlrPagar: 'Total Pagar',
    tasaIva: 'Tasa IVA',
    aviso: 'Aviso',
    color: 'Color',
  };
}

module.exports = { getSheetData, getCompanyData, cN };

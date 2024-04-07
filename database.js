const XLSX = require('xlsx');
const path = require('path');

const excelDataPath = path.join(__dirname, 'database', '02-2024 PLANILLA vencto 20-03-2024.xlsx');
const excelDataPath2 = path.join(__dirname, 'database', 'test.xlsx');

async function getSheetData(fileName) {
  try {
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
  return {
    excelDataObject: await getSheetData('test'),
    RUTProvSW: String(excelDataObject[0].RUTEmisor).toUpperCase().trim(),
    RUTEmisor: String(excelDataObject[0].RUTEmisor).toUpperCase().trim(),
    RutEnvia: '5657540-5',
    RutReceptor: '60803000-K',
    RznSocEmisor: 'AGRICOLA LA FRONTERA LIMITADA',
    GiroEmisor: 'CULTIVO DE PRODUCTOS AGRICOLAS EN COMBINACION CON LA CRIA DE ANIMALES',
    FchResol: '2024-04-01',
    NroResol: 0,
    TipoDTE: 39,
    IndServicio: 3,
  };
}

module.exports = { getSheetData, getCompanyData };

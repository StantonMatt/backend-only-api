const XLSX = require('xlsx');
const path = require('path');

const excelDataPath = path.join(__dirname, 'database', '02-2024 PLANILLA vencto 20-03-2024.xlsx');
const excelDataPath2 = path.join(__dirname, 'agricola-la-frontera', 'test.xlsx');

async function getClientData() {
  try {
    const workbook = XLSX.readFile(excelDataPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    return XLSX.utils.sheet_to_json(worksheet);
  } catch (error) {
    console.error('Error reading the XLSX file:', error);
  }
}

async function getClientData2() {
  try {
    const workbook = XLSX.readFile(excelDataPath2);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    return XLSX.utils.sheet_to_json(worksheet);
  } catch (error) {
    console.error('Error reading the XLSX file:', error);
  }
}

module.exports = { getClientData, getClientData2 };

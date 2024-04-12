const fs = require('fs-extra');
const { create } = require('xmlbuilder2');
const bwipjs = require('bwip-js');
const { cN, getSheetData } = require('./database.js');

const paths = require('./paths.js');

const signedBoletaDteFolderPath = paths.getSignedBoletaDteFolderPath();
const timbresBoletaFolderPath = paths.getTimbresBoletaFolderPath();
const barrasBoletaFolderPath = paths.getBarrasBoletaFolderPath();

async function generateTed() {
  try {
    const files = await fs.readdir(signedBoletaDteFolderPath);
    for (const [index, file] of files.entries()) {
      const fileContents = await fs.readFile(`${signedBoletaDteFolderPath}\\${file}`, 'utf8');
      const tedXml = create(fileContents).end();
      const tedString = tedXml.slice(tedXml.indexOf('<TED'), tedXml.indexOf('<TmstFirma>'));
      const rut = tedString.slice(tedString.indexOf('<RR>'), tedString.indexOf('</RR>')).replace('<RR>', '');

      const timbre = await bwipjs.toBuffer({
        bcid: 'pdf417', // Barcode type
        text: tedString, // Text to encode
        scale: 10, // 1x scaling factor for exact control
        height: 20, // Y Dimension (Row Height), 3:1 ratio to X Dim
        width: 41, // X Dimension (X Width)
        includetext: false, // No text below barcode
        columns: 13, // Adjust column count as needed
        eclevel: 5, // Error correction level
        padding: 2, // Quiet Zone padding (0.25 inches approximated to module width)
        compaction: 'binary', // Byte Compaction Mode
      });

      await fs.writeFile(`${timbresBoletaFolderPath}\\${rut}.png`, timbre);

      const excelDataObject = await getSheetData(0);
      const cdgIntRecep = String(excelDataObject[index][cN().cdgIntRecep]);

      const barra = await bwipjs.toBuffer({
        bcid: 'code128', // Barcode type
        text: cdgIntRecep, // Text to encode
        scale: 10, // 1x scaling factor for exact control
        height: 10, // Y Dimension (Row Height), 3:1 ratio to X Dim
        width: 60, // X Dimension (X Width)
        includetext: false, // No text below barcode
        eclevel: 5, // Error correction level
        padding: 2, // Quiet Zone padding (0.25 inches approximated to module width)
        compaction: 'binary', // Byte Compaction Mode
      });
      if (!excelDataObject[index][cN().isFactura]) {
        await fs.writeFile(`${barrasBoletaFolderPath}\\${cdgIntRecep}.png`, barra);
      }
    }

    console.log(`Timbres successfully saved to drive`);
  } catch (error) {
    console.log(`ERROR: Failed to generate PDF417 Timbres: ${error}`);
  }
}

module.exports = { generateTed };

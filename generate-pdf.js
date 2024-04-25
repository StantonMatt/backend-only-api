const puppeteer = require('puppeteer');
const path = require('path');
const Handlebars = require('handlebars');
const fs = require('fs-extra');
const helper = require('./handlebar-helpers.js');
const utilF = require('./util-file.js');

const billHtmlTemplatePath = path.join(__dirname, 'public', 'puppeteer', 'bill-template.html');
const billHtmlPath = path.join(__dirname, 'public', 'puppeteer', 'bill.html');

Handlebars.registerHelper('formatCurrency', helper.formatCurrency);

Handlebars.registerHelper('formatCurrencyWithSymbol', helper.formatCurrencyWithSymbol);

Handlebars.registerHelper('omitTitleIfNil', helper.omitTitleIfNil);

Handlebars.registerHelper('omitValueIfNil', helper.omitValueIfNil);

Handlebars.registerHelper('addSpaceIfNotNil', helper.addSpaceIfNotNil);

Handlebars.registerHelper('dateFormatter', helper.dateFormatter);

Handlebars.registerHelper('subsidioPercentageFormatter', helper.subsidioPercentageFormatter);

Handlebars.registerHelper('subsidioM3Formatter', helper.subsidioM3Formatter);

Handlebars.registerHelper('repactacionCuotaFormatter', helper.repactacionCuotaFormatter);

Handlebars.registerHelper('repactacionDeudaFormatter', helper.repactacionDeudaFormatter);

let folio;

(async function () {
  folio = await utilF.getPrimerFolioDisponible();
})();

async function generatePDF(data) {
  try {
    const formattedData = {};
    // Object.keys(data).map(originalKey => {
    //   const newKey = originalKey.replaceAll(' ', '_');
    //   formattedData[newKey] = data[originalKey];
    // });
    Object.keys(data).map(originalKey => {
      const newKey = originalKey
        .toLowerCase()
        .split(' ')
        .map((word, index) => {
          if (index > 0 && word) {
            return word[0].toUpperCase() + word.slice(1);
          }
          return word;
        })
        .join('');
      formattedData[newKey] = data[originalKey];
    });
    formattedData['folio'] = Number(folio) + Number(formattedData['n#']) - 1;
    formattedData['barCodeNumber'] =
      String(folio).padStart(7, '0') +
      String(formattedData['numeroCliente']).padStart(8, '0') +
      String(formattedData['totalPagar']).padStart(8, '0');
    console.log(formattedData);
    const templateHtml = await fs.readFile(billHtmlTemplatePath, 'utf8');
    const template = Handlebars.compile(templateHtml);

    const html = template(formattedData);
    await fs.writeFile(billHtmlPath, html);
    // console.log(billHtmlPath);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(billHtmlPath);

    const pdf = await page.pdf({
      path: 'utility-bill.pdf', // Saves PDF directly to a file
      format: 'A4',
      printBackground: true,
    });

    await browser.close();
    return pdf;
  } catch (error) {
    console.error(`Failed to create PDF: ${error}`);
  }
}

module.exports = { generatePDF };

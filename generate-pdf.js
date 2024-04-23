const puppeteer = require('puppeteer');
const path = require('path');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const { cN } = require('./database.js');

const billHtmlTemplatePath = path.join(__dirname, 'public', 'puppeteer', 'bill-template.html');
const billHtmlPath = path.join(__dirname, 'public', 'puppeteer', 'bill.html');

// Register a helper for currency formatting
handlebars.registerHelper('formatCurrency', function (value) {
  // Convert the number to a string and format it as currency
  if (!value) return '';
  const number = parseFloat(value);
  return new Intl.NumberFormat('es-CL').format(number);
});

// Register a helper for currency formatting
handlebars.registerHelper('formatCurrencyWithSymbol', function (value) {
  // Convert the number to a string and format it as currency
  const number = parseFloat(value);
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);
});

async function generatePDF(data) {
  try {
    const formattedData = {};
    Object.keys(data).map(value => {
      const newKey = value.replaceAll(' ', '_');
      formattedData[newKey] = data[value];
    });

    // Helper Function that checks if value exists
    handlebars.registerHelper('ifExistsBlank', function (value) {
      let normalizedStr;
      if (value) normalizedStr = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      else return '';
      if (!data[`${normalizedStr}`]) return '';
      else return value;
    });

    // Helper Function that checks if value exists
    handlebars.registerHelper('ifExistsSpace', function (value) {
      let normalizedStr;
      if (value) normalizedStr = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      else return '&nbsp;';
      if (!data[`${normalizedStr}`]) return '';
      else return '&nbsp;';
    });

    // Helper Function that checks if value exists
    handlebars.registerHelper('dateFormatter', function (dateStr) {
      const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
      const date = new Date(`${dateStr}T12:00:00.000Z`);
      console.log(dateStr);
      console.log(date);
      console.log(date.getDate());
      const day = date.getDate().toString().padStart(2, '0');
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      return `${day}-${months[monthIndex]}-${year}`;
    });

    // Helper Function that checks if value exists
    handlebars.registerHelper('subsidioPercentageHelper', function (value) {
      if (value) return `(${formattedData.Subsidio_Porcentaje}%)`;
      else return '';
    });

    // Helper Function that checks if value exists
    handlebars.registerHelper('subsidioM3Helper', function (value) {
      if (value) return `${formattedData.Subsidio_M3}m³`;
      else return '';
    });

    // Helper Function that checks if value exists
    handlebars.registerHelper('cuotaHelper', function (value) {
      if (value) return `Cuota: ${formattedData.Cuota_Actual}/${formattedData.Numero_Total_Cuotas}`;
      else return '';
    });

    // Helper Function that checks if value exists
    handlebars.registerHelper('deudaHelper', function (value) {
      if (value) {
        const number = parseFloat(formattedData.Deuda_Total);
        const formattedNumber = number.toLocaleString('es-CL', {
          style: 'currency',
          currency: 'CLP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });
        return `Deuda: ${formattedNumber}`;
      } else return '';
    });

    console.log(formattedData);
    const templateHtml = await fs.readFile(billHtmlTemplatePath, 'utf8');
    const template = handlebars.compile(templateHtml);

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

const puppeteer = require('puppeteer');
const path = require('path');

const billTemplatePath = path.join(__dirname, 'public', 'puppeteer', 'bill-template.html');

async function generatePDF(data) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(billTemplatePath, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    path: 'utility-bill.pdf', // Saves PDF directly to a file
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  return pdf;
}

module.exports = { generatePDF };

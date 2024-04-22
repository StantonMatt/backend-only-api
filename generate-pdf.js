const puppeteer = require('puppeteer');
const path = require('path');
const handlebars = require('handlebars');
const fs = require('fs-extra');

const billHtmlTemplatePath = path.join(__dirname, 'public', 'puppeteer', 'bill-template.html');
const billHtmlPath = path.join(__dirname, 'public', 'puppeteer', 'bill.html');

async function generatePDF(data) {
  const templateHtml = await fs.readFile(billHtmlTemplatePath, 'utf8');
  const template = await handlebars.compile(templateHtml);

  const html = template(data);
  await fs.writeFile(billHtmlPath, html);
  console.log(billHtmlPath);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(billHtmlPath, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    path: 'utility-bill.pdf', // Saves PDF directly to a file
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  return pdf;
}

module.exports = { generatePDF };

const puppeteer = require('puppeteer');
const path = require('path');
const util = require('./util-date');

console.log(util.getChartMonths());
console.log(util.getChartPreviousMonths());

const billTemplatePath = path.join(__dirname, 'public', 'puppeteer', 'bill-template.html');

async function generatePDF(data) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const chartDateArray = [];
  if (data[`${util.getChartMonths()[0]}`]) chartDateArray = util.getChartMonths();
  else chartDateArray.push(...util.getChartPreviousMonths());
  const monthlyConsumption = chartDateArray.map(date => data[date]);
  const monthNames = chartDateArray.map(dates => dates.slice(0, 3));
  const clientData = { monthNames, monthlyConsumption };

  console.log(clientData);
  await page.goto(billTemplatePath, { waitUntil: 'networkidle0' });

  // Inject Chart.js
  await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/chart.js' });

  // Inject JavaScript to create the chart
  await page.evaluate(data => {
    return new Promise(resolve => {
      const ctx = document.getElementById('myChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.monthNames,
          datasets: [
            {
              data: data.monthlyConsumption,
              backgroundColor: ['#6e6d6d', '#ffffff'],
              borderColor: ['#000000'],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          devicePixelRatio: window.devicePixelRatio,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          legend: {
            display: false,
          },
          animation: {
            onComplete: () => {
              resolve(); // Resolve the promise once the animation is complete
            },
          },
        },
      });
    });
  }, clientData);

  const pdf = await page.pdf({
    path: 'utility-bill.pdf', // Saves PDF directly to a file
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  return pdf;
}

module.exports = { generatePDF };

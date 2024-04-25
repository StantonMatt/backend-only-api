const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const Chart = require('chart.js');
const ChartDataLabels = require('chartjs-plugin-datalabels');

// Manually register the datalabels plugin if not automatically recognized
Chart.register(ChartDataLabels);

const fs = require('fs-extra');
const paths = require('./paths.js');
const util = require('./util-date');

const graphsBoletaFolderPath = paths.getGraphsBoletaFolderPath();

const width = 4000; //px
const height = 1350; //px
const backgroundColour = 'white';
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour, Chart: Chart });

async function generateChart(data) {
  const chartDateArray = [];

  if (data[`${util.getChartMonths()[0]}`]) {
    chartDateArray.push(...util.getChartMonths().reverse());
  } else {
    chartDateArray.push(...util.getChartPreviousMonths().reverse());
  }
  const monthlyConsumption = chartDateArray.map(date => data[date]);
  const monthNames = chartDateArray.map(dates => dates.slice(0, 3));

  const maxDataValue = Math.max(...monthlyConsumption);
  const buffer = Math.max(1, Math.ceil(maxDataValue * 0.1));

  const configuration = {
    type: 'bar',
    data: {
      labels: monthNames,
      datasets: [
        {
          data: monthlyConsumption,
          backgroundColor: [
            '#2095b92a',
            '#2095b92a',
            '#2095b92a',
            '#2095b92a',
            '#2095b92a',
            '#2095b92a',
            '#2095b92a',
            '#2095b92a',
            '#2095b92a',
            '#2095b92a',
            '#2095b92a',
            '#2095b92a',
            '#20c0983a',
          ],
          borderColor: '#353535', // Specify border color
          borderWidth: 6, // Specify border width
        },
      ],
    },
    options: {
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 100, // Set the font size for x-axis labels
            },
          },
        },
        y: {
          beginAtZero: true,
          suggestedMax: maxDataValue + buffer,
          grid: {
            display: false,
          },
          ticks: {
            precision: 0,
            callback: function (value, index, values) {
              if (Math.floor(value) === value) {
                return value;
              }
            },
            font: {
              size: 100, // Set the font size for x-axis labels
            },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        datalabels: {
          color: '#343436',
          anchor: 'end',
          align: 'top',
          font: {
            size: 90,
          },
        },
      },
    },
  };

  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  await fs.writeFile(graphsBoletaFolderPath + `/graph_${data['Numero Cliente']}.png`, image);
}

module.exports = { generateChart };

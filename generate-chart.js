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

let chartDateArray = [];

async function generateChart(data) {
  const chartAreaBorder = {
    id: 'chartAreaBorder',
    beforeDraw(chart, args, options) {
      const {
        ctx,
        chartArea: { left, top, width, height },
      } = chart;
      ctx.save();
      ctx.strokeStyle = options.borderColor;
      ctx.lineWidth = options.borderWidth;
      ctx.setLineDash(options.borderDash || []);
      ctx.lineDashOffset = options.borderDashOffset;
      ctx.strokeRect(left, top, width, height);
      ctx.restore();
    },
  };

  if (data[`${util.getChartMonths()[0]}`]) {
    chartDateArray = util.getChartMonths();
  } else {
    chartDateArray = [...util.getChartPreviousMonths()];
  }
  const monthlyConsumption = chartDateArray.map(date => data[date]);
  const monthNames = chartDateArray.map(dates => dates.slice(0, 3));

  const configuration = {
    type: 'bar',
    data: {
      labels: monthNames,
      datasets: [
        {
          data: monthlyConsumption,
          backgroundColor: [
            '#20acb923',
            '#20acb923',
            '#20acb923',
            '#20acb923',
            '#20acb923',
            '#20acb923',
            '#20acb923',
            '#20acb923',
            '#20acb923',
            '#20acb923',
            '#20acb923',
            '#20acb923',
            '#20c0983d',
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
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 100, // Set the font size for x-axis labels
            },
          },
          beginAtZero: true,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        datalabels: {
          color: '#343436',
          anchor: 'end',
          align: 'bottom',
          formatter: (value, context) => {
            return value === 0 ? null : value; // Do not show label for value 0
          },
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

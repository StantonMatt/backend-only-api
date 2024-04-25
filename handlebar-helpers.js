'use strict';
const Handlebars = require('handlebars');

function formatCurrency(inputValue) {
  try {
    if (!inputValue) return '';
    const number = parseFloat(inputValue);
    return new Intl.NumberFormat('es-CL').format(number);
  } catch (error) {
    console.error(`ERROR: formatCurrency: ${error}`);
  }
}

function formatCurrencyWithSymbol(inputValue) {
  try {
    const number = parseFloat(inputValue);
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(number);
  } catch (error) {
    console.error(`ERROR: formatCurrencyWithSymbol: ${error}`);
  }
}

function omitTitleIfNil(originalTitle, options) {
  try {
    const context = options.data.root;
    const formattedTitle = originalTitle
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        if (index > 0 && word) {
          return word[0].toUpperCase() + word.slice(1);
        }
        return word;
      })
      .join('');
    if (!context[`${formattedTitle}`]) return '';
    else return originalTitle;
  } catch (error) {
    console.error(`ERROR: omitTitleIfNil: ${error}`);
  }
}

function omitValueIfNil(inputValue, options) {
  try {
    const context = options.data.root;
    const formattedString = inputValue
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        if (index > 0 && word) {
          return word[0].toUpperCase() + word.slice(1);
        }
        return word;
      })
      .join('');
    if (!context[`${formattedString}`]) return '';
    else return context[`${formattedString}`];
  } catch (error) {
    console.error(`ERROR: omitValueIfNil: ${error}`);
  }
}

function addSpaceIfNotNil(inputValue, options) {
  try {
    const context = options.data.root;
    const formattedString = inputValue
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        if (index > 0 && word) {
          return word[0].toUpperCase() + word.slice(1);
        }
        return word;
      })
      .join('');
    if (!context[`${formattedString}`]) return '';
    else return new Handlebars.SafeString('&nbsp;');
  } catch (error) {
    console.error(`ERROR: addSpaceIfNotNil: ${error}`);
  }
}

function dateFormatter(inputDateStr) {
  try {
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const date = new Date(`${inputDateStr}T12:00:00.000Z`);
    const day = date.getDate().toString().padStart(2, '0');
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    return `${day}-${months[monthIndex]}-${year}`;
  } catch (error) {
    console.error(`ERROR: dateFormatter: ${error}`);
  }
}

function subsidioPercentageFormatter(subsidio, options) {
  try {
    const context = options.data.root;
    if (subsidio) {
      return `(${context.subsidioPorcentaje}%)`;
    } else return '';
  } catch (error) {
    console.error(`ERROR: subsidioPercentageFormatter: ${error}`);
  }
}

function subsidioM3Formatter(subsidio, options) {
  try {
    const context = options.data.root;
    if (subsidio) {
      return `${context.subsidioM3}m³`;
    } else return '';
  } catch (error) {
    console.error(`ERROR: subsidioM3Formatter: ${error}`);
  }
}

function repactacionCuotaFormatter(repactacion, options) {
  try {
    // Access additional data directly from the options
    const context = options.data.root;

    if (repactacion) {
      return `Cuota: ${context.cuotaActual}/${context.numeroTotalCuotas}`;
    } else return '';
  } catch (error) {
    console.error(`ERROR: repactacionCuotaFormatter: ${error}`);
  }
}

function repactacionDeudaFormatter(repactacion, options) {
  try {
    const context = options.data.root;
    if (repactacion) {
      const number = parseFloat(context.deudaTotal);
      const formattedNumber = number.toLocaleString('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      return `Deuda: ${formattedNumber}`;
    } else return '';
  } catch (error) {
    console.error(`ERROR: repactacionDeudaFormatter: ${error}`);
  }
}

module.exports = {
  omitTitleIfNil,
  omitValueIfNil,
  addSpaceIfNotNil,
  dateFormatter,
  subsidioPercentageFormatter,
  subsidioM3Formatter,
  repactacionCuotaFormatter,
  repactacionDeudaFormatter,
  formatCurrency,
  formatCurrencyWithSymbol,
};

'use strict';

const FormData = require('form-data');
const { getCompanyData } = require('./database.js');
const paths = require('./paths.js');
const fs = require('fs-extra');

async function getFormData(file) {
  const data = await getCompanyData();
  console.log(file);
  const form = new FormData();
  form.append('rutSender', data.RutEnvia.slice(0, data.RutEnvia.indexOf('-')));
  form.append('dvSender', data.RutEnvia.slice(-1));
  form.append('rutCompany', data.RUTEmisor.slice(0, data.RUTEmisor.indexOf('-')));
  form.append('dvCompany', data.RUTEmisor.slice(-1));
  form.append('archivo', fs.createReadStream(file));

  return form;
}

module.exports = { getFormData };

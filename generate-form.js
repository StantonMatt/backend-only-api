'use strict';

const FormData = require('form-data');
const { getCompanyData } = require('./database.js');
const fs = require('fs-extra');

async function getFormData(file) {
  const data = await getCompanyData();
  console.log(data);
  console.log(file);
  const form = new FormData();
  form.append('rutSender', data.rutEnvia.slice(0, data.rutEnvia.indexOf('-')));
  form.append('dvSender', data.rutEnvia.slice(-1));
  form.append('rutCompany', data.rutEmisor.slice(0, data.rutEmisor.indexOf('-')));
  form.append('dvCompany', data.rutEmisor.slice(-1));
  form.append('archivo', fs.createReadStream(file));

  return form;
}

module.exports = { getFormData };

'use strict';

function getTodayDteFormattedDate() {
  return getDteFormattedDate(new Date());
}

function getDesdeDteFormattedDate() {
  const desdeDate = new Date();
  if (desdeDate.getDate() <= 20) desdeDate.setMonth(desdeDate.getMonth() - 2);
  else desdeDate.setMonth(desdeDate.getMonth() - 1);
  desdeDate.setDate(25);
  return getDteFormattedDate(desdeDate);
}

function getHastaDteFormattedDate() {
  const hastaDate = new Date();
  if (hastaDate.getDate() <= 20) hastaDate.setMonth(hastaDate.getMonth() - 1);
  hastaDate.setDate(24);
  return getDteFormattedDate(hastaDate);
}
function getExpiryDteFormattedDate() {
  const expiryDate = new Date();
  if (expiryDate.getDate() > 20) expiryDate.setMonth(expiryDate.getMonth() + 1);
  expiryDate.setDate(20);
  return getDteFormattedDate(expiryDate);
}

function getIssueDteFormattedDate() {
  const issueDate = new Date();
  if (issueDate.getDate() > 20) issueDate.setMonth(issueDate.getMonth() + 1);
  issueDate.setDate(0);
  return getDteFormattedDate(issueDate);
}

function getDteFormattedDate(date) {
  return new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(date);
}

function getTedFormattedTimeStamp() {
  const tedDate = new Date();
  if (tedDate.getDate() > 10 && tedDate.getDate() <= 20) tedDate.setDate(10);
  const date = new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(tedDate);
  const time = new Intl.DateTimeFormat('sv-SE', {
    timeStyle: 'medium',
    timeZone: 'America/Santiago',
  }).format(tedDate);
  return `${date}T${time}`;
}

function getFormattedTimeStamp() {
  const today = new Date();
  const date = getTodayDteFormattedDate();
  const hour = String(today.getHours()).padStart(2, 0);
  const minutes = String(today.getMinutes()).padStart(2, 0);
  const seconds = String(today.getSeconds()).padStart(2, 0);
  const time = new Intl.DateTimeFormat('sv-SE', {
    timeStyle: 'medium',
    timeZone: 'America/Santiago',
  }).format(today);
  return `${date}T${hour}_${minutes}_${seconds}`;
}

function getChartMonths() {
  let currentDate = new Date();
  const chartDateArray = [];
  for (let i = 0; i < 13; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const month = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date).slice(0, 3).toUpperCase();
    const year = date.getFullYear();
    chartDateArray.push(`${month}-${year}`);
  }

  return chartDateArray;
}

function getChartPreviousMonths() {
  let currentDate = new Date();
  const chartDateArray = [];
  for (let i = 0; i < 13; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1 - i, 1);
    const month = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date).slice(0, 3).toUpperCase();
    const year = date.getFullYear();
    chartDateArray.push(`${month}-${year}`);
  }

  return chartDateArray;
}

module.exports = {
  getTodayDteFormattedDate,
  getExpiryDteFormattedDate,
  getTedFormattedTimeStamp,
  getFormattedTimeStamp,
  getIssueDteFormattedDate,
  getDesdeDteFormattedDate,
  getHastaDteFormattedDate,
  getChartMonths,
  getChartPreviousMonths,
};

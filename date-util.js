'use strict';

function getTodayDteFormattedDate() {
  return getDteFormattedDate(new Date());
}

function getExpiryDteFormattedDate() {
  const expiryDate = new Date();
  if (expiryDate.getDate() > 20) expiryDate.setMonth(expiryDate.getMonth() + 1);
  expiryDate.setDate(20);
  return getDteFormattedDate(expiryDate);
}

function getDteFormattedDate(date) {
  return new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(date);
}

function getTedFormattedTimeStamp() {
  const today = new Date();
  const date = getTodayDteFormattedDate(today);
  const time = new Intl.DateTimeFormat('sv-SE', {
    timeStyle: 'medium',
    timeZone: 'America/Santiago',
  }).format(today);
  return `${date}T${time}`;
}

function getFormattedTimeStamp() {
  const today = new Date();
  const date = getTodayDteFormattedDate(today);
  const hour = String(today.getHours()).padStart(2, 0);
  const minutes = String(today.getMinutes()).padStart(2, 0);
  const seconds = String(today.getSeconds()).padStart(2, 0);
  const time = new Intl.DateTimeFormat('sv-SE', {
    timeStyle: 'medium',
    timeZone: 'America/Santiago',
  }).format(today);
  return `${date}T${hour}_${minutes}_${seconds}`;
}
module.exports = { getTodayDteFormattedDate, getExpiryDteFormattedDate, getTedFormattedTimeStamp, getFormattedTimeStamp };

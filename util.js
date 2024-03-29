'use strict';

function getDteFormattedDate(date) {
  return new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(date);
}

function getTodayDteFormattedDate() {
  return getDteFormattedDate(new Date());
}

function getExpiryDteFormattedDate() {
  const today = new Date();
  if (today.getDate() > 20) today.setMonth(today.getMonth() + 1);
  today.setDate(20);
  return getDteFormattedDate(today);
}

module.exports = { getTodayDteFormattedDate, getExpiryDteFormattedDate };

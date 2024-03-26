const express = require('express');
const app = express();

const runServer = function (dataObject) {
  app.get('/', (req, res) => {
    res.status(200).json(dataObject);
  });

  app.get('/xml', (req, res) => {
    res.type('application/xml');
    res.status(200).send(dataObject.xmlString);
  });

  app.listen(3000, () => {
    console.log('Server listening on port 3000...');
  });
};

module.exports = { runServer };

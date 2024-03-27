const express = require('express');
const app = express();
const port = 3000;

const runServer = function (dataObject) {
  app.get('/', (req, res) => {
    res.status(200).json(dataObject);
  });

  app.get('/xml', (req, res) => {
    res.type('application/xml').status(200).send(dataObject.xmlString);
  });

  app
    .listen(port, () => {
      console.log(`Success! Server is listening on port: ${port}...`);
    })
    .on('error', error => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Oops! Port ${port} is already in use.`);
        // Optionally, attempt to listen on a different port
      } else {
        console.log(error);
      }
    });
};

module.exports = { runServer };

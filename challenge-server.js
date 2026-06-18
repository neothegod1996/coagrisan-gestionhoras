'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT          = 8888;
const CHALLENGE_DIR = '/var/www/html/.well-known/acme-challenge';
const CHALLENGE_PREFIX = '/.well-known/acme-challenge/';

const server = http.createServer((req, res) => {
  if (!req.url.startsWith(CHALLENGE_PREFIX)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const filename = req.url.slice(CHALLENGE_PREFIX.length);

  // Evitar path traversal
  if (!filename || filename.includes('..') || filename.includes('/')) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const filePath = path.join(CHALLENGE_DIR, filename);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`[challenge] Not found: ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    console.log(`[challenge] Served: ${filename}`);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Challenge server — puerto ${PORT}`);
  console.log(`Directorio: ${CHALLENGE_DIR}`);
});

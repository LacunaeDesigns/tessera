// Dev-only static server. Zero dependencies, like everything else here.
// Usage: node tools/serve.js [port]   (default 8137)
// The shipped app must also work from file:// — this exists only so the
// service worker and /qa browser passes have an http origin to run against.
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const port = Number(process.argv[2]) || 8137;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.ics': 'text/calendar; charset=utf-8',
  '.zip': 'application/zip',
  '.png': 'image/png'
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.normalize(path.join(root, urlPath === '/' ? 'index.html' : urlPath));
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('not found: ' + urlPath);
      return;
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}).listen(port, () => console.log('tessera dev server -> http://localhost:' + port + '/'));

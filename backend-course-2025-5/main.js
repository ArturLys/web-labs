const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const superagent = require('superagent');

program
  .requiredOption('-h, --host <host>', 'адреса сервера')
  .requiredOption('-p, --port <port>', 'порт сервера')
  .requiredOption('-c, --cache <path>', 'шлях до директорії з кешем');

try {
  program.parse();
} catch (err) {
  process.exit(1);
}

const options = program.opts();
const cacheDir = path.resolve(options.cache);

// Create cache dir if it doesn't exist
fs.mkdir(cacheDir, { recursive: true }).catch(console.error);

const server = http.createServer(async (req, res) => {
  // Extract HTTP status code from URL (e.g. /200)
  const code = req.url.slice(1);
  const cachePath = path.join(cacheDir, `${code}.jpg`);

  if (!code || isNaN(Number(code))) {
    res.writeHead(400);
    try {
      const data = await fs.readFile(path.join(cacheDir, `400.jpg`));
      res.end(data);
    } catch (err) {
      res.end('You are invalid');
    }
    return;
  }

  try {
    if (req.method === 'GET') {
      try {
        // 1. Try to read from cache
        const data = await fs.readFile(cachePath);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(data);
      } catch (err) {
        // 2. If not in cache, fetch from http.cat
        try {
          const response = await superagent.get(`https://http.cat/${code}`);
          const imageBuffer = response.body;

          // 3. Save to cache and return
          await fs.writeFile(cachePath, imageBuffer);
          res.writeHead(200, { 'Content-Type': 'image/jpeg' });
          res.end(imageBuffer);
        } catch (fetchErr) {
          res.writeHead(404);
          try {
            const data = await fs.readFile(path.join(cacheDir, `404.jpg`));
            res.end(data);
          } catch (err) {
            res.end('You are not found');
          }
        }
      }
    } else if (req.method === 'PUT') {
      // Stream raw image data from request body into local cache
      const body = [];
      req.on('data', chunk => body.push(chunk));
      req.on('end', async () => {
        const buffer = Buffer.concat(body);
        if (buffer.length === 0) {
          res.writeHead(400);
          res.end('Bad Request: Empty Body');
          return;
        }
        await fs.writeFile(cachePath, buffer);
        res.writeHead(201);
        res.end('Created');
      });
    } else if (req.method === 'DELETE') {
      try {
        await fs.unlink(cachePath);
        res.writeHead(200);
        res.end('OK');
      } catch (err) {
        res.writeHead(404);
        try {
          const data = await fs.readFile(path.join(cacheDir, `404.jpg`));
          res.end(data);
        } catch (err) {
          res.end('You are not found');
        }
      }
    } else {
      res.writeHead(405);
      res.end('Method Not Allowed');
    }
  } catch (err) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(Number(options.port), options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});

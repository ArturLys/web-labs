const { program } = require('commander');
const fs = require('fs');
const http = require('http');
const { XMLBuilder } = require('fast-xml-parser');

program
  .requiredOption('-i, --input <path>', 'шлях до файлу (обов\'язковий)')
  .requiredOption('-h, --host <host>', 'адреса сервера')
  .requiredOption('-p, --port <port>', 'порт сервера');

program.configureOutput({
  outputError: (str, write) => write(() => {})
});

try {
  program.parse();
} catch (err) { }

const options = program.opts();

if (!options.input || !options.host || !options.port) {
  console.error("Please, specify input file, host, and port");
  process.exit(1);
}

if (!fs.existsSync(options.input)) {
  console.error("Cannot find input file");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${options.host}:${options.port}`);
  
  // Async file read as required by Lab 4
  fs.readFile(options.input, 'utf-8', (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      return;
    }

    let items = [];
    try {
      items = JSON.parse(data);
    } catch (e) {
      items = data.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
    }

    let filtered = items;

    // Filter by ?furnished=true
    if (url.searchParams.get('furnished') === 'true') {
      filtered = filtered.filter(i => i.furnishingstatus === 'furnished');
    }

    // Filter by ?max_price=X
    const maxPriceStr = url.searchParams.get('max_price');
    if (maxPriceStr) {
      const maxPrice = Number(maxPriceStr);
      filtered = filtered.filter(i => Number(i.price) < maxPrice);
    }

    // We only need specific output fields for the XML
    const xmlHouses = filtered.map(h => ({
      price: h.price,
      area: h.area,
      furnishingstatus: h.furnishingstatus
    }));

    // Generate XML with fast-xml-parser
    const builder = new XMLBuilder({
      arrayNodeName: "house" // fast-xml-parser uses this to wrap array items if needed, or we format it manually
    });

    const xmlObj = {
      houses: {
        house: xmlHouses
      }
    };

    const xmlContent = builder.build(xmlObj);

    res.writeHead(200, { 'Content-Type': 'application/xml' });
    res.end(xmlContent);
  });
});

server.listen(Number(options.port), options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});

const { program } = require('commander');
const fs = require('fs');

program
  .requiredOption('-i, --input <path>', 'шлях до файлу (обов\'язковий)')
  .option('-o, --output <path>', 'шлях до файлу для запису')
  .option('-d, --display', 'вивід у консоль')
  .option('-f, --furnished', 'відобразити лише замебльовані')
  .option('-p, --price <price>', 'максимальна ціна');

program.configureOutput({
  outputError: (str, write) => write(() => {})
});

try {
  program.parse();
} catch (err) { }

const options = program.opts();

if (!options.input) {
  console.error("Please, specify input file");
  process.exit(1);
}

if (!fs.existsSync(options.input)) {
  console.error("Cannot find input file");
  process.exit(1);
}

const data = fs.readFileSync(options.input, 'utf-8');
let items;
try {
  items = JSON.parse(data);
} catch (e) {
  items = data.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
}

let filtered = items;

if (options.furnished) {
  filtered = filtered.filter(i => i.furnishingstatus === 'furnished');
}

if (options.price) {
  const maxPrice = Number(options.price);
  filtered = filtered.filter(i => Number(i.price) < maxPrice);
}

const results = filtered.map(i => `${i.price} ${i.area}`).join('\n');

if (!options.display && !options.output) {
  process.exit(0);
}

if (options.display) {
  if (results) console.log(results);
}

if (options.output) {
  fs.writeFileSync(options.output, results, 'utf-8');
}

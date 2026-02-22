const { program } = require('commander');
const fs = require('fs');

program.exitOverride();

program
  .option('-i, --input <path>', 'шлях до файлу (обов\'язковий)')
  .option('-o, --output <path>', 'шлях до файлу для запису')
  .option('-d, --display', 'вивід у консоль')
  .option('-f, --furnished', 'відобразити лише замебльовані')
  .option('-p, --price <price>', 'максимальна ціна');

try {
  program.parse(process.argv);
} catch (err) {
  // Catching standard commander errors isn't strict enough for custom text sometimes,
  // but we handle missing required flags below.
}

const options = program.opts();

// Check required arg
if (!options.input) {
  console.error("Please, specify input file");
  process.exit(1);
}

// Check missing file
if (!fs.existsSync(options.input)) {
  console.error("Cannot find input file");
  process.exit(1);
}

// Read and parse
const data = fs.readFileSync(options.input, 'utf-8');
const items = JSON.parse(data);

let filtered = items;

// Apply provided filters for Variant 3
if (options.furnished) {
  filtered = filtered.filter(i => i.furnishingstatus === 'furnished');
}

if (options.price) {
  const maxPrice = Number(options.price);
  filtered = filtered.filter(i => Number(i.price) < maxPrice);
}

// Format the specific 2 fields required: price and area
const results = filtered.map(i => `${i.price} ${i.area}`).join('\n');

// Standard requirements
if (!options.display && !options.output) {
  process.exit(0);
}

if (options.display) {
  if (results) console.log(results);
}

if (options.output) {
  fs.writeFileSync(options.output, results, 'utf-8');
}

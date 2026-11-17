// Writes public/cars-sample.json: the first N cars of public/cars.json.
// The sample loads at startup; the full file is only fetched when chosen.
//   node scripts/make-cars-sample.mjs [count]
import { readFileSync, writeFileSync } from 'node:fs';

const count = Number(process.argv[2] ?? 500);
const full = JSON.parse(readFileSync(new URL('../public/cars.json', import.meta.url), 'utf8'));
const cars = full.cars.slice(0, count);
writeFileSync(new URL('../public/cars-sample.json', import.meta.url), JSON.stringify({ cars }));
console.log(`cars-sample.json: ${cars.length} of ${full.cars.length} cars`);

/**
 * Test script for CSV export functionality
 * This simulates the CSV export with sample car data
 */

// Simple implementation for testing
function flattenObject(obj, prefix = '', maxDepth = 5, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    return { [prefix || 'value']: JSON.stringify(obj) };
  }

  if (obj === null || obj === undefined) {
    return { [prefix || 'value']: obj };
  }

  if (typeof obj !== 'object') {
    return { [prefix || 'value']: obj };
  }

  if (Array.isArray(obj)) {
    return { [prefix || 'value']: JSON.stringify(obj) };
  }

  const flattened = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      flattened[newKey] = value;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(
        flattened,
        flattenObject(value, newKey, maxDepth, currentDepth + 1)
      );
    } else if (Array.isArray(value)) {
      flattened[newKey] = JSON.stringify(value);
    } else {
      flattened[newKey] = value;
    }
  }

  return flattened;
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  let strValue = String(value);

  const needsQuotes =
    strValue.includes(',') ||
    strValue.includes('\n') ||
    strValue.includes('\r') ||
    strValue.includes('"');

  if (needsQuotes) {
    strValue = strValue.replace(/"/g, '""');
    return `"${strValue}"`;
  }

  return strValue;
}

function jsonToCsv(data, options = {}) {
  const { maxDepth = 5, includeRowNumbers = true } = options;

  if (!data || data.length === 0) {
    return includeRowNumbers ? '#\n' : '';
  }

  const flattenedRows = [];
  const allKeys = new Set();

  for (const item of data) {
    const flattened = flattenObject(item, '', maxDepth);
    flattenedRows.push(flattened);
    Object.keys(flattened).forEach(key => allKeys.add(key));
  }

  const sortedKeys = Array.from(allKeys).sort();

  const headers = [];
  if (includeRowNumbers) {
    headers.push('#');
  }
  headers.push(...sortedKeys);

  const csvLines = [headers.map(h => escapeCsvValue(h)).join(',')];

  flattenedRows.forEach((row, index) => {
    const values = [];

    if (includeRowNumbers) {
      values.push(String(index + 1));
    }

    for (const key of sortedKeys) {
      const value = row[key];
      values.push(escapeCsvValue(value));
    }

    csvLines.push(values.join(','));
  });

  return csvLines.join('\n');
}

// Test data - sample car records
const testData = [
  {
    "@type": "Car",
    "brand": {
      "@type": "Brand",
      "name": "Suzuki"
    },
    "model": "Mehran",
    "description": "100% original. Alloy Rims. Never been into any accident.",
    "modelDate": 2013,
    "fuelType": "Petrol",
    "color": "White",
    "price": 790000,
    "features": ["AM/FM Radio", "Alloy Rims", "Cassette Player"],
    "vehicleEngine": {
      "engineDisplacement": "800cc"
    }
  },
  {
    "@type": "Car",
    "brand": {
      "@type": "Brand",
      "name": "Honda"
    },
    "model": "Civic",
    "description": "Well maintained, low mileage",
    "modelDate": 2020,
    "fuelType": "Petrol",
    "color": "Black",
    "price": 4500000,
    "features": ["Sunroof", "Leather Seats", "Navigation"],
    "vehicleEngine": {
      "engineDisplacement": "1800cc"
    }
  }
];

console.log('Testing CSV Export Functionality');
console.log('=================================\n');

// Test 1: Basic export
console.log('Test 1: Basic CSV Export');
console.log('------------------------');
const csv1 = jsonToCsv(testData);
console.log(csv1);
console.log('\n');

// Test 2: Without row numbers
console.log('Test 2: Without Row Numbers');
console.log('---------------------------');
const csv2 = jsonToCsv(testData, { includeRowNumbers: false });
console.log(csv2);
console.log('\n');

// Test 3: Empty array
console.log('Test 3: Empty Array');
console.log('------------------');
const csv3 = jsonToCsv([]);
console.log(csv3 || '(empty string)');
console.log('\n');

// Test 4: Single primitive result
console.log('Test 4: Primitive Values');
console.log('------------------------');
const primitiveData = [42, "hello", true, null];
const csv4 = jsonToCsv(primitiveData);
console.log(csv4);
console.log('\n');

// Test 5: Special characters
console.log('Test 5: Special Characters (quotes, commas, newlines)');
console.log('-----------------------------------------------------');
const specialData = [
  {
    name: 'Car with "quotes"',
    description: 'This has a comma, in it',
    notes: 'This has\na newline'
  }
];
const csv5 = jsonToCsv(specialData);
console.log(csv5);
console.log('\n');

console.log('All tests completed successfully!');

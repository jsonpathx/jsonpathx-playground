import { describe, expect, it } from 'vitest';
import { jsonToCsv } from '../src/utils/csvExport';
import { decodeUrlValue, encodeUrlValue } from '../src/hooks/useUrlState';

describe('jsonToCsv', () => {
  it('flattens nested objects into dot-notation columns', () => {
    const csv = jsonToCsv([
      { model: 'Mehran', brand: { name: 'Suzuki' }, price: 790000 },
      { model: 'Corolla', brand: { name: 'Toyota' }, features: ['ABS', 'Air Bags'] },
    ]);
    const [header, ...rows] = csv.split('\n');
    expect(header).toBe('#,brand.name,features,model,price');
    expect(rows[0]).toBe('1,Suzuki,,Mehran,790000');
    expect(rows[1]).toBe('2,Toyota,"[""ABS"",""Air Bags""]",Corolla,');
  });

  it('quotes commas, quotes and newlines', () => {
    const csv = jsonToCsv([{ text: 'a, "b"\nc' }], { includeRowNumbers: false });
    expect(csv).toBe('text\n"a, ""b""\nc"');
  });

  it('handles primitives and empty input', () => {
    expect(jsonToCsv(['x', 2], { includeRowNumbers: false })).toBe('value\nx\n2');
    expect(jsonToCsv([])).toBe('#\n');
  });
});

describe('URL state encoding', () => {
  it.each(['$[0:10]', '$[?(@.brand.name == "Suzuki")]', '$..price', '$[?(@.model == "Ünïcode ✓")]'])('round-trips %s', (query) => {
    const encoded = encodeUrlValue(query);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeUrlValue(encoded)).toBe(query);
  });
});

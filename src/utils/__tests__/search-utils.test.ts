/**
 * Unit tests for search utilities
 * Run with: npm test search-utils.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  recursiveSearch,
  filterResults,
  highlightText,
  highlightJsonText,
  debounce,
} from '../search-utils';

describe('recursiveSearch', () => {
  it('should find matches in string values', () => {
    const data = { name: 'John Doe', age: 30 };
    const matches = recursiveSearch(data, 'John', false);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].matchedText).toBe('John Doe');
  });

  it('should find matches in nested objects', () => {
    const data = {
      user: {
        profile: {
          name: 'Jane Smith',
        },
      },
    };
    const matches = recursiveSearch(data, 'Jane', false);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should find matches in arrays', () => {
    const data = ['apple', 'banana', 'orange'];
    const matches = recursiveSearch(data, 'banana', false);
    expect(matches.length).toBe(1);
  });

  it('should be case-insensitive by default', () => {
    const data = { text: 'Hello World' };
    const matches = recursiveSearch(data, 'hello', false);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should be case-sensitive when specified', () => {
    const data = { text: 'Hello World' };
    const matchesLower = recursiveSearch(data, 'hello', true);
    const matchesUpper = recursiveSearch(data, 'Hello', true);
    expect(matchesLower.length).toBe(0);
    expect(matchesUpper.length).toBeGreaterThan(0);
  });

  it('should find matches in object keys', () => {
    const data = { userName: 'test' };
    const matches = recursiveSearch(data, 'userName', false);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should find matches in numbers', () => {
    const data = { price: 2500, year: 2020 };
    const matches = recursiveSearch(data, '2500', false);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should handle null and undefined', () => {
    const data = { value: null, other: undefined };
    const matches = recursiveSearch(data, 'null', false);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should return empty array for no matches', () => {
    const data = { name: 'test' };
    const matches = recursiveSearch(data, 'xyz123', false);
    expect(matches.length).toBe(0);
  });

  it('should return empty array for empty search term', () => {
    const data = { name: 'test' };
    const matches = recursiveSearch(data, '', false);
    expect(matches.length).toBe(0);
  });
});

describe('filterResults', () => {
  it('should filter array of results', () => {
    const results = [
      { name: 'Toyota Camry', year: 2020 },
      { name: 'Honda Accord', year: 2021 },
      { name: 'Toyota Corolla', year: 2019 },
    ];
    const filtered = filterResults(results, 'Toyota', false);
    expect(filtered.length).toBe(2);
  });

  it('should return all results for empty search', () => {
    const results = [{ name: 'test1' }, { name: 'test2' }];
    const filtered = filterResults(results, '', false);
    expect(filtered.length).toBe(2);
  });

  it('should return empty array when no matches', () => {
    const results = [{ name: 'test1' }, { name: 'test2' }];
    const filtered = filterResults(results, 'xyz', false);
    expect(filtered.length).toBe(0);
  });

  it('should respect case sensitivity', () => {
    const results = [{ name: 'TEST' }, { name: 'test' }];
    const filtered = filterResults(results, 'TEST', true);
    expect(filtered.length).toBe(1);
  });
});

describe('highlightText', () => {
  it('should segment text with matches', () => {
    const segments = highlightText('Hello World', 'World', false);
    expect(segments.length).toBe(2);
    expect(segments[0].isMatch).toBe(false);
    expect(segments[1].isMatch).toBe(true);
    expect(segments[1].text).toBe('World');
  });

  it('should handle multiple matches', () => {
    const segments = highlightText('test test test', 'test', false);
    expect(segments.length).toBe(5); // test, ' ', test, ' ', test
  });

  it('should be case-insensitive by default', () => {
    const segments = highlightText('Hello World', 'hello', false);
    expect(segments.some((s) => s.isMatch)).toBe(true);
  });

  it('should be case-sensitive when specified', () => {
    const segments = highlightText('Hello World', 'hello', true);
    expect(segments.every((s) => !s.isMatch)).toBe(true);
  });

  it('should return single segment for no matches', () => {
    const segments = highlightText('test', 'xyz', false);
    expect(segments.length).toBe(1);
    expect(segments[0].isMatch).toBe(false);
  });

  it('should handle empty search term', () => {
    const segments = highlightText('test', '', false);
    expect(segments.length).toBe(1);
    expect(segments[0].isMatch).toBe(false);
  });

  it('should handle empty text', () => {
    const segments = highlightText('', 'test', false);
    expect(segments.length).toBe(1);
  });
});

describe('highlightJsonText', () => {
  it('should wrap matches in mark tags', () => {
    const result = highlightJsonText('{"name": "test"}', 'test', false);
    expect(result).toContain('<mark class="search-highlight">');
    expect(result).toContain('</mark>');
  });

  it('should handle multiple matches', () => {
    const text = 'test test test';
    const result = highlightJsonText(text, 'test', false);
    const markCount = (result.match(/<mark/g) || []).length;
    expect(markCount).toBe(3);
  });

  it('should return original text for empty search', () => {
    const text = '{"name": "test"}';
    const result = highlightJsonText(text, '', false);
    expect(result).toBe(text);
  });

  it('should be case-sensitive when specified', () => {
    const result = highlightJsonText('Test test', 'test', true);
    const markCount = (result.match(/<mark/g) || []).length;
    expect(markCount).toBe(1); // Only lowercase 'test'
  });
});

describe('debounce', () => {
  it('should delay function execution', (done) => {
    let called = false;
    const debouncedFn = debounce(() => {
      called = true;
    }, 100);

    debouncedFn();
    expect(called).toBe(false);

    setTimeout(() => {
      expect(called).toBe(true);
      done();
    }, 150);
  });

  it('should cancel previous calls', (done) => {
    let callCount = 0;
    const debouncedFn = debounce(() => {
      callCount++;
    }, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    setTimeout(() => {
      expect(callCount).toBe(1); // Only last call executed
      done();
    }, 150);
  });

  it('should pass arguments correctly', (done) => {
    let receivedArg: string | undefined;
    const debouncedFn = debounce((arg: string) => {
      receivedArg = arg;
    }, 50);

    debouncedFn('test');

    setTimeout(() => {
      expect(receivedArg).toBe('test');
      done();
    }, 100);
  });
});

describe('Edge cases', () => {
  it('should handle deeply nested objects', () => {
    const data = {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                value: 'deep',
              },
            },
          },
        },
      },
    };
    const matches = recursiveSearch(data, 'deep', false);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should handle circular references gracefully', () => {
    const data: any = { name: 'test' };
    data.self = data; // Create circular reference

    // Should not cause infinite loop or stack overflow
    expect(() => {
      recursiveSearch(data, 'test', false);
    }).not.toThrow();
  });

  it('should handle special characters in search term', () => {
    const data = { text: 'Price: $25.99' };
    const matches = recursiveSearch(data, '$25', false);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should handle unicode characters', () => {
    const data = { text: 'Hello 世界 🌍' };
    const matches = recursiveSearch(data, '世界', false);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should handle very long strings', () => {
    const longString = 'a'.repeat(10000) + 'needle' + 'b'.repeat(10000);
    const data = { text: longString };
    const matches = recursiveSearch(data, 'needle', false);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should handle arrays with mixed types', () => {
    const data = [1, 'two', { three: 3 }, [4], null, undefined, true];
    const matches = recursiveSearch(data, 'two', false);
    expect(matches.length).toBeGreaterThan(0);
  });
});

describe('Performance', () => {
  it('should handle large datasets efficiently', () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      description: `Description for item ${i}`,
    }));

    const start = Date.now();
    const filtered = filterResults(largeData, 'Item 500', false);
    const duration = Date.now() - start;

    expect(filtered.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
  });

  it('should handle multiple searches quickly', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      value: `test${i}`,
    }));

    const start = Date.now();
    for (let i = 0; i < 10; i++) {
      filterResults(data, `test${i}`, false);
    }
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500); // 10 searches in less than 500ms
  });
});

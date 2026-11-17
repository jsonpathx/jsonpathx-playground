/**
 * Search utilities for filtering and highlighting JSON results
 */

export interface SearchMatch {
  path: string[];
  value: unknown;
  matchedText: string;
}

/**
 * Recursively searches through an object/array for matches
 * @param data - The data to search through
 * @param searchTerm - The term to search for
 * @param caseSensitive - Whether the search should be case-sensitive
 * @param currentPath - Current path in the object tree (for tracking)
 * @returns Array of matching paths and values
 */
export function recursiveSearch(
  data: unknown,
  searchTerm: string,
  caseSensitive: boolean = false,
  currentPath: string[] = []
): SearchMatch[] {
  const matches: SearchMatch[] = [];

  if (!searchTerm) {
    return matches;
  }

  const searchNormalized = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  // Objects and arrays on the current branch, so a circular reference is
  // visited once instead of recursing forever.
  const ancestors = new WeakSet<object>();

  function searchValue(value: unknown, path: string[]): void {
    // Handle null and undefined
    if (value === null || value === undefined) {
      const stringValue = String(value);
      const compareValue = caseSensitive ? stringValue : stringValue.toLowerCase();
      if (compareValue.includes(searchNormalized)) {
        matches.push({ path: [...path], value, matchedText: stringValue });
      }
      return;
    }

    // Handle primitives (string, number, boolean)
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      const stringValue = String(value);
      const compareValue = caseSensitive ? stringValue : stringValue.toLowerCase();
      if (compareValue.includes(searchNormalized)) {
        matches.push({ path: [...path], value, matchedText: stringValue });
      }
      return;
    }

    if (typeof value === 'object') {
      if (ancestors.has(value)) return;
      ancestors.add(value);
      try {
        searchContainer(value, path);
      } finally {
        ancestors.delete(value);
      }
    }
  }

  function searchContainer(value: object, path: string[]): void {
    // Handle arrays
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        searchValue(item, [...path, `[${index}]`]);
      });
      return;
    }

    // Handle objects
    Object.entries(value).forEach(([key, val]) => {
      // Check if the key itself matches
      const keyCompare = caseSensitive ? key : key.toLowerCase();
      if (keyCompare.includes(searchNormalized)) {
        matches.push({ path: [...path, key], value: val, matchedText: key });
      }
      // Recursively search the value
      searchValue(val, [...path, key]);
    });
  }

  searchValue(data, currentPath);
  return matches;
}

/**
 * Filters an array of results based on search criteria
 * @param results - Array of results to filter
 * @param searchTerm - The term to search for
 * @param caseSensitive - Whether the search should be case-sensitive
 * @returns Filtered array of results that contain matches
 */
export function filterResults(
  results: unknown[],
  searchTerm: string,
  caseSensitive: boolean = false
): unknown[] {
  if (!searchTerm) {
    return results;
  }

  return results.filter((result, index) => {
    const matches = recursiveSearch(result, searchTerm, caseSensitive, [`[${index}]`]);
    return matches.length > 0;
  });
}

/**
 * Highlights matching text in a string
 * @param text - The text to highlight matches in
 * @param searchTerm - The term to highlight
 * @param caseSensitive - Whether the search should be case-sensitive
 * @returns Array of text segments with match indicators
 */
export function highlightText(
  text: string,
  searchTerm: string,
  caseSensitive: boolean = false
): Array<{ text: string; isMatch: boolean }> {
  if (!searchTerm || !text) {
    return [{ text, isMatch: false }];
  }

  const searchNormalized = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  const textNormalized = caseSensitive ? text : text.toLowerCase();

  const segments: Array<{ text: string; isMatch: boolean }> = [];
  let lastIndex = 0;

  let index = textNormalized.indexOf(searchNormalized);
  while (index !== -1) {
    // Add non-matching text before the match
    if (index > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, index),
        isMatch: false,
      });
    }

    // Add the matching text
    segments.push({
      text: text.substring(index, index + searchTerm.length),
      isMatch: true,
    });

    lastIndex = index + searchTerm.length;
    index = textNormalized.indexOf(searchNormalized, lastIndex);
  }

  // Add remaining non-matching text
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      isMatch: false,
    });
  }

  return segments;
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape text for use as HTML content (the result is set with innerHTML). */
function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}

/**
 * Highlights matches in formatted JSON text
 * @param jsonText - The JSON text to highlight
 * @param searchTerm - The term to highlight
 * @param caseSensitive - Whether the search should be case-sensitive
 * @returns HTML: the text, HTML-escaped, with matches wrapped in <mark> (the
 *   input itself when the search term is empty)
 */
export function highlightJsonText(
  jsonText: string,
  searchTerm: string,
  caseSensitive: boolean = false
): string {
  if (!searchTerm) {
    return jsonText;
  }

  const searchNormalized = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  const textNormalized = caseSensitive ? jsonText : jsonText.toLowerCase();

  let result = '';
  let lastIndex = 0;

  let index = textNormalized.indexOf(searchNormalized);
  while (index !== -1) {
    // Add non-matching text before the match
    result += escapeHtml(jsonText.substring(lastIndex, index));

    // Add the matching text with highlight marker
    result += `<mark class="search-highlight">${escapeHtml(jsonText.substring(index, index + searchTerm.length))}</mark>`;

    lastIndex = index + searchTerm.length;
    index = textNormalized.indexOf(searchNormalized, lastIndex);
  }

  // Add remaining non-matching text
  result += escapeHtml(jsonText.substring(lastIndex));

  return result;
}

/**
 * Debounce function for search input
 * @param func - The function to debounce
 * @param wait - The delay in milliseconds
 * @returns Debounced function, with `cancel()` to drop a pending call
 */
export function debounce<A extends unknown[]>(
  func: (...args: A) => void,
  wait: number
): ((...args: A) => void) & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: A) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      func(...args);
    }, wait);
  };

  return Object.assign(debounced, {
    cancel: () => {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
    },
  });
}

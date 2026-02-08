/**
 * CSV Export Utility for JSONPathX Results
 * Converts JSON data to CSV format with proper escaping and handling of complex types
 */

/**
 * Flattens a nested object into a single-level object with dot notation keys
 * Example: { user: { name: "John" } } => { "user.name": "John" }
 */
function flattenObject(
  obj: unknown,
  prefix = '',
  maxDepth = 5,
  currentDepth = 0
): Record<string, unknown> {
  if (currentDepth >= maxDepth) {
    return { [prefix || 'value']: JSON.stringify(obj) };
  }

  if (obj === null || obj === undefined) {
    return { [prefix || 'value']: obj };
  }

  // Handle primitive types
  if (typeof obj !== 'object') {
    return { [prefix || 'value']: obj };
  }

  // Handle arrays - stringify them
  if (Array.isArray(obj)) {
    return { [prefix || 'value']: JSON.stringify(obj) };
  }

  // Handle objects
  const flattened: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      flattened[newKey] = value;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively flatten nested objects
      Object.assign(
        flattened,
        flattenObject(value, newKey, maxDepth, currentDepth + 1)
      );
    } else if (Array.isArray(value)) {
      // Stringify arrays
      flattened[newKey] = JSON.stringify(value);
    } else {
      // Primitive values
      flattened[newKey] = value;
    }
  }

  return flattened;
}

/**
 * Escapes a value for CSV format
 * - Wraps in quotes if contains comma, newline, or quote
 * - Escapes quotes by doubling them
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let strValue = String(value);

  // Check if value needs to be quoted
  const needsQuotes =
    strValue.includes(',') ||
    strValue.includes('\n') ||
    strValue.includes('\r') ||
    strValue.includes('"');

  if (needsQuotes) {
    // Escape existing quotes by doubling them
    strValue = strValue.replace(/"/g, '""');
    return `"${strValue}"`;
  }

  return strValue;
}

/**
 * Options for CSV export
 */
export interface CsvExportOptions {
  /** Maximum depth for flattening nested objects (default: 5) */
  maxDepth?: number;
  /** Include row numbers in the first column (default: true) */
  includeRowNumbers?: boolean;
  /** Custom filename (default: auto-generated with timestamp) */
  filename?: string;
  /** Trigger browser download (default: true) */
  download?: boolean;
}

/**
 * Converts JSON results to CSV format
 * Handles nested objects by flattening with dot notation
 * Handles arrays by stringifying them
 * Returns CSV string
 */
export function jsonToCsv(
  data: unknown[],
  options: CsvExportOptions = {}
): string {
  const {
    maxDepth = 5,
    includeRowNumbers = true,
  } = options;

  // Handle empty data
  if (!data || data.length === 0) {
    return includeRowNumbers ? '#\n' : '';
  }

  // Flatten all objects and collect all unique keys
  const flattenedRows: Array<Record<string, unknown>> = [];
  const allKeys = new Set<string>();

  for (const item of data) {
    const flattened = flattenObject(item, '', maxDepth);
    flattenedRows.push(flattened);

    // Collect all keys to ensure consistent columns
    Object.keys(flattened).forEach(key => allKeys.add(key));
  }

  // Sort keys alphabetically for consistent output
  const sortedKeys = Array.from(allKeys).sort();

  // Build CSV header
  const headers: string[] = [];
  if (includeRowNumbers) {
    headers.push('#');
  }
  headers.push(...sortedKeys);

  const csvLines: string[] = [
    headers.map(h => escapeCsvValue(h)).join(',')
  ];

  // Build CSV rows
  flattenedRows.forEach((row, index) => {
    const values: string[] = [];

    if (includeRowNumbers) {
      values.push(String(index + 1));
    }

    // Ensure all columns are present in order
    for (const key of sortedKeys) {
      const value = row[key];
      values.push(escapeCsvValue(value));
    }

    csvLines.push(values.join(','));
  });

  return csvLines.join('\n');
}

/**
 * Exports JSON results to CSV and triggers browser download
 */
export function exportResultsToCsv(
  results: unknown[],
  options: CsvExportOptions = {}
): void {
  const {
    filename = `jsonpathx-results-${Date.now()}.csv`,
    download = true,
  } = options;

  // Handle edge cases
  if (!results || results.length === 0) {
    console.warn('No results to export');

    if (download) {
      // Export empty CSV with just headers
      const csv = options.includeRowNumbers !== false ? '#\n' : '';
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      triggerDownload(blob, filename);
    }
    return;
  }

  // Generate CSV
  try {
    const csv = jsonToCsv(results, options);

    if (download) {
      // Create blob and trigger download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      triggerDownload(blob, filename);
    }
  } catch (error) {
    console.error('Failed to export CSV:', error);
    throw new Error('Failed to export results to CSV. Please try again.');
  }
}

/**
 * Triggers browser download for a blob
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Gets statistics about the CSV export
 */
export function getCsvExportStats(results: unknown[]): {
  rowCount: number;
  columnCount: number;
  estimatedSize: string;
} {
  if (!results || results.length === 0) {
    return {
      rowCount: 0,
      columnCount: 0,
      estimatedSize: '0 KB',
    };
  }

  // Flatten first item to get column count
  const flattened = flattenObject(results[0]);
  const columnCount = Object.keys(flattened).length;

  // Estimate size (rough calculation)
  const csv = jsonToCsv(results.slice(0, Math.min(10, results.length)));
  const avgRowSize = csv.length / Math.min(10, results.length);
  const estimatedBytes = avgRowSize * results.length;

  let estimatedSize: string;
  if (estimatedBytes < 1024) {
    estimatedSize = `${estimatedBytes.toFixed(0)} B`;
  } else if (estimatedBytes < 1024 * 1024) {
    estimatedSize = `${(estimatedBytes / 1024).toFixed(1)} KB`;
  } else {
    estimatedSize = `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return {
    rowCount: results.length,
    columnCount,
    estimatedSize,
  };
}

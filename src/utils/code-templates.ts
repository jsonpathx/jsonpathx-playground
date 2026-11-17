import type { LanguageTemplate } from '../types/code-generator';

/**
 * Escape special characters for JSON strings
 */
export function escapeJsonString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Format JSON data for code insertion with size limit
 */
export function formatDataForCode(data: unknown, maxItems = 3): string {
  if (Array.isArray(data)) {
    if (data.length > maxItems) {
      const preview = data.slice(0, maxItems);
      return JSON.stringify(preview, null, 2).replace(/\]$/, '  // ... and more items\n]');
    }
  }
  return JSON.stringify(data, null, 2);
}

/**
 * Languages the code generator supports (names and install hints for the UI;
 * the code itself is built in code-generator.ts).
 */
export const LANGUAGE_TEMPLATES: Record<string, LanguageTemplate> = {
  javascript: {
    name: 'JavaScript (Node.js)',
    language: 'javascript',
    install: 'npm install @jsonpathx/jsonpathx',
    installCommand: 'npm install @jsonpathx/jsonpathx',
    extension: 'js',
    description: 'Node.js: ES modules (async) or CommonJS (sync)',
    supportsAsync: true,
  },
  typescript: {
    name: 'TypeScript',
    language: 'typescript',
    install: 'npm install @jsonpathx/jsonpathx',
    installCommand: 'npm install @jsonpathx/jsonpathx && npm install -D @types/node typescript',
    extension: 'ts',
    description: 'TypeScript with full type safety',
    supportsAsync: true,
  },
  browser: {
    name: 'Browser JavaScript',
    language: 'browser',
    install: 'Load from a CDN (esm.sh) or npm + a bundler',
    installCommand: 'npm install @jsonpathx/jsonpathx',
    extension: 'html',
    description: 'A standalone HTML page using the ES module from a CDN',
    supportsAsync: true,
  },
};

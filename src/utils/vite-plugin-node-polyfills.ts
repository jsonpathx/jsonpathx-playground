import type { Plugin } from 'vite';

/**
 * Vite plugin to handle Node.js dynamic imports in browser environment
 * Replaces dynamic imports of Node.js modules with polyfills
 */
export function nodePolyfillsPlugin(): Plugin {
  return {
    name: 'node-polyfills',
    enforce: 'pre',

    resolveId(id) {
      // Handle dynamic imports of Node.js modules
      if (id === 'fs/promises' || id === 'fs') {
        return '\0node-fs-polyfill';
      }
      return null;
    },

    load(id) {
      if (id === '\0node-fs-polyfill') {
        // Return a polyfill that throws errors for Node.js-only functions
        return `
          export const readFile = () => {
            throw new Error('fs operations are not available in browser environment. Use fetch() or File API instead.');
          };

          export const writeFile = () => {
            throw new Error('fs operations are not available in browser environment.');
          };

          export const readdir = () => {
            throw new Error('fs operations are not available in browser environment.');
          };

          export default {
            readFile,
            writeFile,
            readdir,
          };
        `;
      }
      return null;
    },

    transform(code, id) {
      // Handle dynamic imports in the code
      if (id.includes('node_modules') || !id.includes('jsonpathx')) {
        return null;
      }

      // Replace dynamic imports of fs/promises with our polyfill
      if (code.includes("import('fs/promises')") || code.includes('import("fs/promises")')) {
        const transformed = code
          .replace(/await\s+import\(['"]fs\/promises['"]\)/g, '(async () => { throw new Error("fs/promises is not available in browser"); })()')
          .replace(/import\(['"]fs\/promises['"]\)/g, 'Promise.reject(new Error("fs/promises is not available in browser"))');

        return {
          code: transformed,
          map: null,
        };
      }

      return null;
    },
  };
}

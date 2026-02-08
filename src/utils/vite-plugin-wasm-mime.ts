import type { Plugin } from 'vite';
import type { Connect } from 'vite';

/**
 * Vite plugin to serve WASM files with correct MIME type
 * Fixes: "Incorrect response MIME type. Expected 'application/wasm'."
 */
export function wasmMimePlugin(): Plugin {
  const wasmMiddleware: Connect.NextHandleFunction = (req, res, next) => {
    // Check if request is for a WASM file
    if (req.url?.includes('.wasm')) {
      const originalSetHeader = res.setHeader.bind(res);
      const originalWriteHead = res.writeHead.bind(res);

      // Override setHeader to ensure MIME type
      res.setHeader = function(name: string, value: string | number | readonly string[]) {
        if (name.toLowerCase() === 'content-type' && !String(value).includes('application/wasm')) {
          return originalSetHeader('Content-Type', 'application/wasm');
        }
        return originalSetHeader(name, value);
      };

      // Override writeHead to ensure MIME type
      res.writeHead = function(statusCode: number, ...args: any[]) {
        if (!res.hasHeader('Content-Type')) {
          res.setHeader('Content-Type', 'application/wasm');
        }
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        return originalWriteHead(statusCode, ...args);
      };
    }
    next();
  };

  return {
    name: 'wasm-mime-type',
    enforce: 'pre',

    configureServer(server) {
      server.middlewares.use(wasmMiddleware);
    },

    configurePreviewServer(server) {
      server.middlewares.use(wasmMiddleware);
    },
  };
}

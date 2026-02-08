import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'path';
import { nodePolyfillsPlugin } from './src/utils/vite-plugin-node-polyfills';
import { wasmMimePlugin } from './src/utils/vite-plugin-wasm-mime';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    wasmMimePlugin(),
    nodePolyfillsPlugin(),
    react(),
    wasm(),
    topLevelAwait(),
  ],
  server: {
    port: 3000,
    open: true,
    fs: {
      allow: ['..'],
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  assetsInclude: ['**/*.wasm'],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    exclude: ['@jsonpathx/jsonpathx'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  resolve: {
    alias: {
      // Node.js module polyfills for browser
      'fs': path.resolve(__dirname, './src/utils/fs-polyfill.ts'),
      'fs/promises': path.resolve(__dirname, './src/utils/fs-polyfill.ts'),
      'path': 'path-browserify',
      'stream': 'stream-browserify',
      'util': 'util',
    },
  },
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
  worker: {
    format: 'es',
  },
});

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Point directly to the ESM build file
      'lucide': resolve(__dirname, './node_modules/lucide/dist/esm/lucide/src/lucide.js'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
}); 

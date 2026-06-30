import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Served from https://crpozo.github.io/helixona-module-careplan/ on GitHub
// Pages, so assets must resolve under that sub-path. We keep the same base
// locally (dev + preview run at http://localhost:<port>/helixona-module-careplan/)
// so `npm run preview` faithfully mirrors production.
export default defineConfig({
  base: '/helixona-module-careplan/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Output into docs/ so GitHub Pages "Deploy from a branch → main → /docs"
    // serves the compiled app (the repo root holds the un-built Vite source).
    outDir: 'docs',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // STABLE filenames (no content hash). GitHub Pages caches index.html
        // for ~10 min; with hashed names a redeploy deletes the old chunks and
        // a cached index.html 404s -> blank page. Stable names mean a cached
        // index.html always resolves to files that still exist.
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})

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
  server: {
    port: 5173,
    host: true,
  },
})

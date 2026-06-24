import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Build output stays inside frontend/dist (Vercel @vercel/static-build reads from distDir: "dist")
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  // Local development proxy: forward /api/* to the Express backend
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})

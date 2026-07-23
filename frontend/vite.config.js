import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        // Backend sets httpOnly cookies scoped to its own origin; rewriting
        // the Set-Cookie domain lets them work through the Vite dev proxy.
        cookieDomainRewrite: 'localhost',
      }
    }
  }
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://13.140.141.32',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://13.140.141.32',
        changeOrigin: true,
      },
    },
  },
})

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // O backend Spring não tem CORS configurado. Em desenvolvimento, o Vite
    // repassa tudo que começa com /api para http://localhost:8080 (removendo o /api),
    // então o navegador só fala com a própria origem e não há bloqueio de CORS.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

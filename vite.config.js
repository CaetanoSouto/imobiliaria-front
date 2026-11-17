import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Endereço do backend em desenvolvimento. Padrão: http://localhost:8080.
  // Se a porta 8080 estiver ocupada, crie um arquivo .env.local (o git ignora) com:
  //   API_PROXY_TARGET=http://localhost:8090
  const env = loadEnv(mode, process.cwd(), '')
  const alvoDaApi = env.API_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // O backend Spring não tem CORS configurado. Em desenvolvimento, o Vite
      // repassa tudo que começa com /api para o backend (removendo o /api),
      // então o navegador só fala com a própria origem e não há bloqueio de CORS.
      proxy: {
        '/api': {
          target: alvoDaApi,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})

import axios from 'axios'

export const TOKEN_KEY = 'imobiliaria:token'
export const USER_KEY = 'imobiliaria:usuario'

export const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
})

// Quem cuida da sessão (AuthContext) registra aqui o que fazer quando der 401.
let aoExpirarSessao = null
export function registrarAoExpirarSessao(callback) {
  aoExpirarSessao = callback
}

// Toda requisição envia "Authorization: Bearer <token>" quando houver token salvo.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 com token salvo = sessão expirada ou token inválido: apaga o token e vai ao login.
// Sem token salvo (ex.: senha errada no login) o 401 passa direto para a tela tratar.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      if (aoExpirarSessao) {
        aoExpirarSessao()
      } else if (window.location.pathname !== '/login') {
        window.location.assign('/login?expirada=1')
      }
    }
    return Promise.reject(error)
  },
)

export default api

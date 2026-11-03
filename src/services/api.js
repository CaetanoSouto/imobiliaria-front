import axios from 'axios'

export const TOKEN_KEY = 'imobiliaria:token'
export const USER_KEY = 'imobiliaria:usuario'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

// Toda requisição envia "Authorization: Bearer <token>" quando houver token salvo.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 = sessão expirada ou token inválido: apaga o token e manda para o login.
// (A tela de login entra na semana 2; por enquanto só limpamos a sessão.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      if (window.location.pathname !== '/login') {
        window.location.assign('/login?expirada=1')
      }
    }
    return Promise.reject(error)
  },
)

export default api

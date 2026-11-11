import api from './api'

// POST /auth/login -> { token, tipo, email }
export async function entrar(email, senha) {
  const { data } = await api.post('/auth/login', { email, senha })
  return data
}

import api from './api'

// `busca` filtra por nome ou e-mail (feito no backend).
export async function listarUsuarios(busca) {
  const { data } = await api.get('/users', { params: busca ? { busca } : undefined })
  return Array.isArray(data) ? data : []
}

export async function criarUsuario(usuario) {
  await api.post('/users/register', usuario)
}

export async function atualizarUsuario(id, usuario) {
  await api.put(`/users/${id}`, usuario)
}

export async function excluirUsuario(id) {
  await api.delete(`/users/${id}`)
}

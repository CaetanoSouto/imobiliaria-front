import api from './api'

export async function listarTipos() {
  const { data } = await api.get('/tipos-imoveis')
  return Array.isArray(data) ? data : []
}

export async function criarTipo(tipo) {
  await api.post('/tipos-imoveis', tipo)
}

export async function atualizarTipo(id, tipo) {
  await api.put(`/tipos-imoveis/${id}`, tipo)
}

export async function excluirTipo(id) {
  await api.delete(`/tipos-imoveis/${id}`)
}

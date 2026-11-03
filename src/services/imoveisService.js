import api from './api'

export async function listarImoveis() {
  const { data } = await api.get('/imoveis')
  return Array.isArray(data) ? data : []
}

export async function buscarImovel(id) {
  const { data } = await api.get(`/imoveis/${id}`)
  return data
}

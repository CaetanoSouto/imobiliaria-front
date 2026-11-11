import api from './api'

// ---- Ofertas ----
export async function criarOferta({ imovelId, tipo, valorProposto, mensagem }) {
  const { data } = await api.post('/ofertas', { imovelId, tipo, valorProposto, mensagem })
  return data
}

export async function listarMinhasOfertas() {
  const { data } = await api.get('/ofertas/minhas')
  return Array.isArray(data) ? data : []
}

export async function cancelarOferta(id) {
  const { data } = await api.patch(`/ofertas/${id}/cancelar`)
  return data
}

// ---- Favoritos ----
export async function listarFavoritos() {
  const { data } = await api.get('/favoritos')
  return Array.isArray(data) ? data : []
}

export async function adicionarFavorito(imovelId) {
  const { data } = await api.post(`/favoritos/${imovelId}`)
  return data
}

export async function removerFavorito(imovelId) {
  await api.delete(`/favoritos/${imovelId}`)
}

// ---- Contratos ----
export async function listarMeusContratos() {
  const { data } = await api.get('/contratos/meus')
  return Array.isArray(data) ? data : []
}

export async function assinarContrato(id) {
  const { data } = await api.patch(`/contratos/${id}/assinar`)
  return data
}

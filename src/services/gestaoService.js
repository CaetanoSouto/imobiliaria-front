import api from './api'

// Chamadas de quem gerencia: o corretor aceita/recusa ofertas, o admin aprova/cancela contratos.
// Os dois perfis podem listar tudo (ver SecurityConfig do backend).

// ---- Ofertas ----
export async function listarOfertas(status) {
  const { data } = await api.get('/ofertas', { params: status ? { status } : undefined })
  return Array.isArray(data) ? data : []
}

// Aceitar prepara o contrato (fica aguardando a aprovação do admin).
export async function aceitarOferta(id, condicoes) {
  const { data } = await api.patch(`/ofertas/${id}/aceitar`, condicoes ? { condicoes } : {})
  return data
}

export async function recusarOferta(id) {
  const { data } = await api.patch(`/ofertas/${id}/recusar`)
  return data
}

// ---- Contratos ----
export async function listarContratos() {
  const { data } = await api.get('/contratos')
  return Array.isArray(data) ? data : []
}

export async function aprovarContrato(id) {
  const { data } = await api.patch(`/contratos/${id}/aprovar`)
  return data
}

export async function cancelarContrato(id) {
  const { data } = await api.patch(`/contratos/${id}/cancelar`)
  return data
}

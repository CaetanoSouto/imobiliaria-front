import api from './api'

// Fotos dos imóveis (só admin). As fotos de cada imóvel vêm em GET /imoveis/{id}.
export async function enviarFoto(imovelId, arquivo) {
  const formulario = new FormData()
  formulario.append('arquivo', arquivo)
  formulario.append('imovelId', imovelId)
  const { data } = await api.post('/fotos', formulario)
  return data
}

// Define se é a capa e/ou a posição: { capa: true, ordem: 0 }
export async function atualizarFoto(id, { capa, ordem }) {
  const { data } = await api.put(`/fotos/${id}`, { capa, ordem })
  return data
}

export async function excluirFoto(id) {
  await api.delete(`/fotos/${id}`)
}

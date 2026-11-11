import api from './api'

export async function listarBairros() {
  const { data } = await api.get('/bairros')
  return Array.isArray(data) ? data : []
}

export async function criarBairro(bairro) {
  await api.post('/bairros', bairro)
}

export async function atualizarBairro(id, bairro) {
  await api.put(`/bairros/${id}`, bairro)
}

export async function excluirBairro(id) {
  await api.delete(`/bairros/${id}`)
}

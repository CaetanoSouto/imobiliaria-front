import api from './api'

// Cadastro de imóveis (só admin). A listagem pública está em imoveisService.
export async function criarImovel(imovel) {
  await api.post('/imoveis', imovel)
}

export async function atualizarImovel(id, imovel) {
  await api.put(`/imoveis/${id}`, imovel)
}

export async function excluirImovel(id) {
  await api.delete(`/imoveis/${id}`)
}

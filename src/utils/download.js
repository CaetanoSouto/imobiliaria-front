import api from '../services/api'

// Baixa um arquivo protegido (que exige o token). Um <a href> comum não envia o cabeçalho
// Authorization, então a gente busca o arquivo pela API e salva o resultado.
export async function baixarArquivo(caminho, nomeArquivo) {
  let resposta
  try {
    resposta = await api.get(caminho, { responseType: 'blob' })
  } catch (erro) {
    // Num download, até o erro chega como arquivo: lê o JSON para a mensagem do backend aparecer.
    if (erro.response?.data instanceof Blob) {
      try {
        erro.response.data = JSON.parse(await erro.response.data.text())
      } catch {
        erro.response.data = null
      }
    }
    throw erro
  }
  const url = URL.createObjectURL(resposta.data)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const baixarPdfContrato = (id) => baixarArquivo(`/contratos/${id}/pdf`, `contrato-${id}.pdf`)

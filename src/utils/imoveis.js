import { API_URL } from '../services/api'

export const POR_PAGINA = 9

export const FINALIDADES = { ALUGUEL: 'Aluguel', VENDA: 'Venda' }

export function rotuloFinalidade(finalidade) {
  return FINALIDADES[finalidade] || 'Aluguel'
}

// Valor exibido/ordenado conforme a finalidade (venda -> precoVenda, aluguel -> precoAluguel).
export function valorImovel(imovel) {
  const principal = imovel.finalidade === 'VENDA' ? imovel.precoVenda : imovel.precoAluguel
  const alternativo = imovel.finalidade === 'VENDA' ? imovel.precoAluguel : imovel.precoVenda
  const valor = principal ?? alternativo
  return valor === null || valor === undefined ? null : Number(valor)
}

export function estaDisponivel(imovel) {
  return imovel.status === 'DISPONIVEL'
}

// Caminhos relativos (/uploads/...) passam pela mesma base da API (proxy do Vite em dev).
function urlFoto(url) {
  return /^https?:\/\//.test(url) ? url : `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

// Fotos ordenadas, com a capa primeiro. Cada item já vem com a URL final para <img src>.
export function fotosDoImovel(imovel) {
  return [...(imovel.fotos || [])]
    .filter((f) => f.url || f.caminho)
    .sort((a, b) => Number(Boolean(b.capa)) - Number(Boolean(a.capa)) || (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((f) => ({ id: f.id, url: urlFoto(f.url || f.caminho) }))
}

export function fotoCapa(imovel) {
  return fotosDoImovel(imovel)[0]?.url ?? null
}

// ---- Filtros, ordenação e paginação (rodam no front: a API devolve a lista inteira) ----

const ORDENS_VALIDAS = ['preco-asc', 'preco-desc']

// Lê os filtros da URL. Valores inválidos são ignorados.
export function lerParametros(searchParams) {
  const finalidade = searchParams.get('finalidade')
  const ordem = searchParams.get('ordem')
  const pagina = Number.parseInt(searchParams.get('pagina'), 10)
  return {
    bairro: searchParams.get('bairro') || '',
    finalidade: finalidade in FINALIDADES ? finalidade : '',
    min: searchParams.get('min') || '',
    max: searchParams.get('max') || '',
    ordem: ORDENS_VALIDAS.includes(ordem) ? ordem : '',
    pagina: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
  }
}

const paraNumero = (texto) => (String(texto).trim() === '' ? null : Number(String(texto).replace(',', '.')))

// Valida a faixa de preço digitada. Retorna { min?, max? } com mensagens de erro.
export function validarFaixaPreco(min, max) {
  const erros = {}
  const vMin = paraNumero(min)
  const vMax = paraNumero(max)
  if (vMin !== null && (!Number.isFinite(vMin) || vMin < 0)) erros.min = 'Informe um número válido (0 ou maior).'
  if (vMax !== null && (!Number.isFinite(vMax) || vMax < 0)) erros.max = 'Informe um número válido (0 ou maior).'
  if (!erros.min && !erros.max && vMin !== null && vMax !== null && vMin > vMax) {
    erros.max = 'O valor máximo deve ser maior ou igual ao mínimo.'
  }
  return erros
}

export function filtrarImoveis(imoveis, { bairro, finalidade, min, max }) {
  const vMin = paraNumero(min)
  const vMax = paraNumero(max)
  return imoveis.filter((imovel) => {
    if (bairro && String(imovel.bairro?.id) !== String(bairro)) return false
    if (finalidade && imovel.finalidade !== finalidade) return false
    const valor = valorImovel(imovel)
    if (vMin !== null && Number.isFinite(vMin) && (valor === null || valor < vMin)) return false
    if (vMax !== null && Number.isFinite(vMax) && (valor === null || valor > vMax)) return false
    return true
  })
}

export function ordenarImoveis(imoveis, ordem) {
  if (!ordem) return imoveis
  const sentido = ordem === 'preco-desc' ? -1 : 1
  // Imóveis sem valor ("sob consulta") ficam sempre no fim.
  return [...imoveis].sort((a, b) => {
    const va = valorImovel(a)
    const vb = valorImovel(b)
    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1
    return (va - vb) * sentido
  })
}

export function paginar(itens, pagina, porPagina = POR_PAGINA) {
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina))
  const atual = Math.min(Math.max(pagina, 1), totalPaginas)
  const inicio = (atual - 1) * porPagina
  return { itens: itens.slice(inicio, inicio + porPagina), pagina: atual, totalPaginas, total: itens.length }
}

// Junta tudo: filtra -> ordena -> pagina.
export function consultarImoveis(imoveis, params) {
  return paginar(ordenarImoveis(filtrarImoveis(imoveis, params), params.ordem), params.pagina)
}

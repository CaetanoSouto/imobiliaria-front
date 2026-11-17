import { rotuloContrato, rotuloOferta, rotuloStatus } from './formatar'

// Cores dos gráficos (passos escuros da paleta categórica validada). A cor segue a
// situação, nunca a posição: "Assinado" é sempre aqua, "Pendente" é sempre azul etc.
const AZUL = '#3987e5'
const LARANJA = '#d95926'
const AQUA = '#199e70'
const AMARELO = '#c98500'
const VIOLETA = '#9085e9'
const VERMELHO = '#e66767'
const CINZA = '#898781'

// A ordem de cada lista é a ordem das barras e foi validada (validate_palette.js, modo escuro):
// cores vizinhas se distinguem mesmo com daltonismo. O cinza é o neutro de "encerrado/inativo"
// e fica sempre por último; cada barra também traz o nome e o valor escritos.
export const SITUACOES_OFERTA = [
  { chave: 'PENDENTE', cor: AZUL },
  { chave: 'EM_ESPERA', cor: AMARELO },
  { chave: 'ACEITA', cor: AQUA },
  { chave: 'RECUSADA', cor: VERMELHO },
  { chave: 'CANCELADA', cor: CINZA },
]

export const SITUACOES_CONTRATO = [
  { chave: 'AGUARDANDO_APROVACAO', cor: AZUL },
  { chave: 'AGUARDANDO_ASSINATURA', cor: AMARELO },
  { chave: 'ASSINADO', cor: AQUA },
  { chave: 'CANCELADO', cor: CINZA },
]

export const SITUACOES_IMOVEL = [
  { chave: 'DISPONIVEL', cor: AQUA },
  { chave: 'ALUGADO', cor: AZUL },
  { chave: 'RESERVADO', cor: AMARELO },
  { chave: 'VENDIDO', cor: VIOLETA },
  { chave: 'INDISPONIVEL', cor: CINZA },
]

export const COR_SERIE = AZUL

// Conta quantos itens há em cada situação, na ordem fixa de `situacoes`.
export function contarPorSituacao(lista, pegarStatus, situacoes, rotulo) {
  const contagem = {}
  lista.forEach((item) => {
    const status = pegarStatus(item)
    contagem[status] = (contagem[status] || 0) + 1
  })
  return situacoes.map(({ chave, cor }) => ({
    chave,
    rotulo: rotulo(chave),
    valor: contagem[chave] || 0,
    cor,
  }))
}

export const ofertasPorSituacao = (ofertas) =>
  contarPorSituacao(ofertas, (o) => o.status, SITUACOES_OFERTA, rotuloOferta)

export const contratosPorSituacao = (contratos) =>
  contarPorSituacao(contratos, (c) => c.status, SITUACOES_CONTRATO, rotuloContrato)

export const imoveisPorSituacao = (imoveis) =>
  contarPorSituacao(imoveis, (i) => i.status || 'DISPONIVEL', SITUACOES_IMOVEL, rotuloStatus)

export const contar = (lista, status) => lista.filter((item) => item.status === status).length

// Imóveis em cada bairro, do que tem mais para o que tem menos. Passando de `limite` bairros,
// o resto vira "Outros". Uma cor só: aqui o que muda é o tamanho da barra, não a categoria.
export function imoveisPorBairro(imoveis, limite = 8) {
  const contagem = new Map()
  imoveis.forEach((i) => {
    const nome = i.bairro?.nome || 'Sem bairro'
    contagem.set(nome, (contagem.get(nome) || 0) + 1)
  })
  const ordenados = [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
  const principais = ordenados.slice(0, limite)
  const resto = ordenados.slice(limite).reduce((soma, [, valor]) => soma + valor, 0)
  if (resto > 0) principais.push(['Outros', resto])
  return principais.map(([rotulo, valor]) => ({ chave: rotulo, rotulo, valor, cor: COR_SERIE }))
}

// Imóveis por finalidade (venda x aluguel): duas categorias, duas cores da paleta.
export function imoveisPorFinalidade(imoveis) {
  const contagem = { VENDA: 0, ALUGUEL: 0 }
  imoveis.forEach((i) => {
    if (i.finalidade === 'VENDA') contagem.VENDA += 1
    else contagem.ALUGUEL += 1
  })
  return [
    { chave: 'VENDA', rotulo: 'Venda', valor: contagem.VENDA, cor: AZUL },
    { chave: 'ALUGUEL', rotulo: 'Aluguel', valor: contagem.ALUGUEL, cor: LARANJA },
  ]
}

// Ofertas enviadas em cada um dos últimos `meses` meses (do mais antigo ao atual).
export function ofertasPorMes(ofertas, meses = 6, agora = new Date()) {
  const faixas = []
  for (let i = meses - 1; i >= 0; i -= 1) {
    const inicio = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    faixas.push({
      ano: inicio.getFullYear(),
      mes: inicio.getMonth(),
      rotulo: inicio.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      valor: 0,
    })
  }
  ofertas.forEach((o) => {
    const data = new Date(o.dataCriacao)
    if (Number.isNaN(data.getTime())) return
    const faixa = faixas.find((f) => f.ano === data.getFullYear() && f.mes === data.getMonth())
    if (faixa) faixa.valor += 1
  })
  return faixas
}

// Soma do valor dos contratos assinados.
export function valorAssinado(contratos) {
  return contratos
    .filter((c) => c.status === 'ASSINADO')
    .reduce((soma, c) => soma + Number(c.oferta?.valorProposto || 0), 0)
}

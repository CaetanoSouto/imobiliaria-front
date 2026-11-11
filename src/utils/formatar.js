const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatarPreco(valor) {
  if (valor === null || valor === undefined || valor === '') return 'Sob consulta'
  return moeda.format(Number(valor))
}

const ROTULOS_STATUS = {
  DISPONIVEL: 'Disponível',
  RESERVADO: 'Reservado',
  ALUGADO: 'Alugado',
  VENDIDO: 'Vendido',
  INDISPONIVEL: 'Indisponível',
}

export function rotuloStatus(status) {
  return ROTULOS_STATUS[status] || 'Disponível'
}

// Situação das ofertas e dos contratos (valores vindos do backend).
const ROTULOS_OFERTA = {
  PENDENTE: 'Pendente',
  ACEITA: 'Aceita',
  EM_ESPERA: 'Em espera',
  RECUSADA: 'Recusada',
  CANCELADA: 'Cancelada',
}

const ROTULOS_CONTRATO = {
  AGUARDANDO_ASSINATURA: 'Aguardando assinatura',
  ASSINADO: 'Assinado',
  CANCELADO: 'Cancelado',
}

export const rotuloOferta = (status) => ROTULOS_OFERTA[status] || status
export const rotuloContrato = (status) => ROTULOS_CONTRATO[status] || status

export function formatarData(iso) {
  if (!iso) return '—'
  const data = new Date(iso)
  return Number.isNaN(data.getTime())
    ? '—'
    : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

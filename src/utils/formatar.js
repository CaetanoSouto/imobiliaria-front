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

import { formatarPreco } from './formatar'
import { valorImovel } from './imoveis'

// E-mail da imobiliária vem de VITE_IMOBILIARIA_EMAIL (veja .env.example).
export const EMAIL_IMOBILIARIA = import.meta.env.VITE_IMOBILIARIA_EMAIL || 'contato@imobiliaria.com'

// Link mailto: com assunto e corpo já preenchidos (código, tipo, bairro e valor do imóvel).
export function montarLinkContato(imovel) {
  const tipo = imovel.tipoImovel?.nome || 'Imóvel'
  const bairro = imovel.bairro?.nome || 'não informado'
  const valor = formatarPreco(valorImovel(imovel))

  const assunto = `Interesse no imóvel cód. ${imovel.id} - ${tipo} em ${bairro}`
  const corpo = [
    'Olá! Tenho interesse no imóvel abaixo e gostaria de mais informações.',
    '',
    `Código: ${imovel.id}`,
    `Tipo: ${tipo}`,
    `Bairro: ${bairro}`,
    `Valor: ${valor}`,
    '',
    'Aguardo o contato. Obrigado!',
  ].join('\n')

  return `mailto:${EMAIL_IMOBILIARIA}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`
}

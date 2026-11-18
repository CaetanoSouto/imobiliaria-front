import { formatarPreco } from './formatar'
import { valorImovel } from './imoveis'

// E-mail da imobiliária vem de VITE_IMOBILIARIA_EMAIL (veja .env.example).
export const EMAIL_IMOBILIARIA = import.meta.env.VITE_IMOBILIARIA_EMAIL || 'contato@imobiliaria.com'

// Assunto e corpo já preenchidos com o código, o tipo, o bairro e o valor do imóvel.
export function montarMensagemContato(imovel) {
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

  return { assunto, corpo }
}

// Abre o programa de e-mail instalado no computador (só funciona se houver um configurado).
export function montarLinkContato(imovel) {
  const { assunto, corpo } = montarMensagemContato(imovel)
  return `mailto:${EMAIL_IMOBILIARIA}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`
}

// Abre a tela de escrever do Gmail no navegador, já preenchida. Não depende de programa instalado.
export function montarLinkGmail(imovel) {
  const { assunto, corpo } = montarMensagemContato(imovel)
  const params = new URLSearchParams({ view: 'cm', fs: '1', to: EMAIL_IMOBILIARIA, su: assunto, body: corpo })
  return `https://mail.google.com/mail/?${params.toString()}`
}

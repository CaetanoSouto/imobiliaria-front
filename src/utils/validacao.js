export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Aceita "1500", "1500.50" e "1.500,50"; devolve null se não for um número.
export function lerNumero(texto) {
  const limpo = String(texto ?? '').trim()
  if (!limpo) return null
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const numero = Number(normalizado)
  return Number.isFinite(numero) ? numero : null
}

// Número inteiro >= 0 (dormitórios, banheiros, vagas...). Vazio é permitido.
export function inteiroValido(texto) {
  const limpo = String(texto ?? '').trim()
  return limpo === '' || /^\d+$/.test(limpo)
}

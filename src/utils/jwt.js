// Lê o payload do JWT (só leitura: a assinatura é validada pelo backend).
export function decodificarJwt(token) {
  try {
    const parte = token.split('.')[1]
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function tokenExpirado(token) {
  const payload = decodificarJwt(token)
  if (!payload?.exp) return true
  return payload.exp * 1000 <= Date.now()
}

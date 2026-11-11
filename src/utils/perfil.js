// Área inicial de cada perfil (USER = cliente).
export function areaInicial(tipo) {
  return tipo === 'ADMIN' ? '/admin' : '/cliente'
}

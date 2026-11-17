// Área inicial de cada perfil (USER = cliente).
export function areaInicial(tipo) {
  if (tipo === 'ADMIN') return '/admin'
  if (tipo === 'CORRETOR') return '/corretor'
  return '/cliente'
}

// Perfis que o admin pode atribuir (valores do backend).
export const PERFIS = [
  { valor: 'USER', rotulo: 'Cliente' },
  { valor: 'CORRETOR', rotulo: 'Corretor' },
  { valor: 'ADMIN', rotulo: 'Administrador' },
]

export const rotuloPerfil = (tipo) => PERFIS.find((p) => p.valor === tipo)?.rotulo || tipo

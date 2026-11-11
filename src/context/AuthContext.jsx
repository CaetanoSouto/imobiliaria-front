import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { TOKEN_KEY, USER_KEY, registrarAoExpirarSessao } from '../services/api'
import { entrar } from '../services/authService'
import { decodificarJwt, tokenExpirado } from '../utils/jwt'

const AuthContext = createContext(null)

// Restaura a sessão salva; se o token já venceu, descarta.
function lerSessao() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token || tokenExpirado(token)) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      return null
    }
    const usuario = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    if (usuario?.tipo) return { token, usuario }
    const payload = decodificarJwt(token)
    const tipo = payload?.roles?.[0]?.replace('ROLE_', '')
    return tipo ? { token, usuario: { email: payload.sub, tipo } } : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(lerSessao)
  // Motivo do último logout automático (ex.: sessão expirada), exibido na tela de login.
  const [sessaoExpirada, setSessaoExpirada] = useState(false)

  const sair = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setSessao(null)
  }, [])

  const expirar = useCallback(() => {
    sair()
    setSessaoExpirada(true)
  }, [sair])

  // 401 vindo da API (token expirado/inválido) derruba a sessão.
  useEffect(() => {
    registrarAoExpirarSessao(expirar)
    return () => registrarAoExpirarSessao(null)
  }, [expirar])

  // Derruba a sessão no exato momento em que o token vence.
  useEffect(() => {
    if (!sessao) return undefined
    const exp = decodificarJwt(sessao.token)?.exp
    if (!exp) return undefined
    const restante = exp * 1000 - Date.now()
    const id = setTimeout(expirar, Math.max(restante, 0))
    return () => clearTimeout(id)
  }, [sessao, expirar])

  const login = useCallback(async (email, senha) => {
    const { token, tipo } = await entrar(email, senha)
    const usuario = { email, tipo }
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(usuario))
    setSessaoExpirada(false)
    setSessao({ token, usuario })
    return usuario
  }, [])

  const valor = useMemo(
    () => ({
      usuario: sessao?.usuario ?? null,
      autenticado: Boolean(sessao),
      ehAdmin: sessao?.usuario.tipo === 'ADMIN',
      sessaoExpirada,
      login,
      logout: sair,
    }),
    [sessao, sessaoExpirada, login, sair],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return contexto
}

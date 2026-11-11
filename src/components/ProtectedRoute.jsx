import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Protege um grupo de rotas. Sem sessão -> /login. Perfil não permitido -> /acesso-negado.
// Uso: <Route element={<ProtectedRoute perfis={['ADMIN']} />}> ...rotas... </Route>
export default function ProtectedRoute({ perfis }) {
  const { autenticado, usuario } = useAuth()
  const local = useLocation()

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ de: local.pathname }} />
  }
  if (perfis && !perfis.includes(usuario.tipo)) {
    return <Navigate to="/acesso-negado" replace />
  }
  return <Outlet />
}

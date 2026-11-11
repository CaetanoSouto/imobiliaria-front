import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'
import Rodape from './components/Rodape'
import Vitrine from './pages/Vitrine'
import DetalheImovel from './pages/DetalheImovel'
import Login from './pages/Login'
import AcessoNegado from './pages/AcessoNegado'
import AreaCliente from './pages/AreaCliente'
import AreaAdmin from './pages/AreaAdmin'
import Bairros from './pages/admin/Bairros'
import MinhasOfertas from './pages/cliente/MinhasOfertas'
import Favoritos from './pages/cliente/Favoritos'
import MeusContratos from './pages/cliente/MeusContratos'
import NaoEncontrada from './pages/NaoEncontrada'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
        <Header />
        <main className="principal">
          <Routes>
            {/* Área pública */}
            <Route path="/" element={<Vitrine />} />
            <Route path="/imoveis/:id" element={<DetalheImovel />} />
            <Route path="/login" element={<Login />} />
            <Route path="/acesso-negado" element={<AcessoNegado />} />

            {/* Área do cliente (USER) */}
            <Route element={<ProtectedRoute perfis={['USER']} />}>
              <Route path="/cliente" element={<AreaCliente />} />
              <Route path="/cliente/ofertas" element={<MinhasOfertas />} />
              <Route path="/cliente/favoritos" element={<Favoritos />} />
              <Route path="/cliente/contratos" element={<MeusContratos />} />
            </Route>

            {/* Área do admin */}
            <Route element={<ProtectedRoute perfis={['ADMIN']} />}>
              <Route path="/admin" element={<AreaAdmin />} />
              <Route path="/admin/bairros" element={<Bairros />} />
            </Route>

            <Route path="*" element={<NaoEncontrada />} />
          </Routes>
        </main>
        <Rodape />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

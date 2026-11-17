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
import AreaCorretor from './pages/AreaCorretor'
import GestaoOfertas from './pages/GestaoOfertas'
import GestaoContratos from './pages/GestaoContratos'
import Bairros from './pages/admin/Bairros'
import Fotos from './pages/admin/Fotos'
import Imoveis from './pages/admin/Imoveis'
import Tipos from './pages/admin/Tipos'
import Usuarios from './pages/admin/Usuarios'
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

            {/* Área do corretor: aceita ofertas e prepara os contratos */}
            <Route element={<ProtectedRoute perfis={['CORRETOR']} />}>
              <Route path="/corretor" element={<AreaCorretor />} />
              <Route path="/corretor/ofertas" element={<GestaoOfertas podeDecidir />} />
              <Route path="/corretor/contratos" element={<GestaoContratos />} />
            </Route>

            {/* Área do admin: aprova os contratos */}
            <Route element={<ProtectedRoute perfis={['ADMIN']} />}>
              <Route path="/admin" element={<AreaAdmin />} />
              <Route path="/admin/ofertas" element={<GestaoOfertas podeDecidir />} />
              <Route path="/admin/contratos" element={<GestaoContratos podeDecidir />} />
              <Route path="/admin/imoveis" element={<Imoveis />} />
              <Route path="/admin/fotos" element={<Fotos />} />
              <Route path="/admin/bairros" element={<Bairros />} />
              <Route path="/admin/tipos" element={<Tipos />} />
              <Route path="/admin/usuarios" element={<Usuarios />} />
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

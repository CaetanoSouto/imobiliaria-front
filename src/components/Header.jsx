import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { NOME_IMOBILIARIA } from '../utils/marca'

// Menu por perfil: visitante vê Entrar; cliente e admin só veem as opções do seu perfil.
export default function Header() {
  const { autenticado, usuario, logout } = useAuth()
  const navigate = useNavigate()

  const sair = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="header">
      <div className="container header__conteudo">
        <Link to="/" className="header__marca" aria-label={`${NOME_IMOBILIARIA} Imóveis — início`}>
          <span className="header__logo" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11.5 12 4l9 7.5" />
              <path d="M5.5 10v9.5h13V10" />
              <path d="M10 19.5v-5h4v5" />
            </svg>
          </span>
          <span>
            {NOME_IMOBILIARIA} <small>Imóveis</small>
          </span>
        </Link>
        <nav className="header__menu" aria-label="Menu principal">
          <NavLink to="/" end>
            Imóveis
          </NavLink>
          {usuario?.tipo === 'USER' && (
            <>
              <NavLink to="/cliente" end>
                Minha área
              </NavLink>
              <NavLink to="/cliente/ofertas">Ofertas</NavLink>
              <NavLink to="/cliente/favoritos">Favoritos</NavLink>
              <NavLink to="/cliente/contratos">Contratos</NavLink>
            </>
          )}
          {usuario?.tipo === 'CORRETOR' && (
            <>
              <NavLink to="/corretor" end>
                Painel
              </NavLink>
              <NavLink to="/corretor/ofertas">Ofertas</NavLink>
              <NavLink to="/corretor/contratos">Contratos</NavLink>
            </>
          )}
          {usuario?.tipo === 'ADMIN' && (
            <>
              <NavLink to="/admin" end>
                Painel
              </NavLink>
              <NavLink to="/admin/ofertas">Ofertas</NavLink>
              <NavLink to="/admin/contratos">Contratos</NavLink>
              <NavLink to="/admin/imoveis">Imóveis</NavLink>
              <NavLink to="/admin/fotos">Fotos</NavLink>
              <NavLink to="/admin/bairros">Bairros</NavLink>
              <NavLink to="/admin/tipos">Tipos</NavLink>
              <NavLink to="/admin/usuarios">Usuários</NavLink>
            </>
          )}
          {autenticado ? (
            <>
              <span className="header__usuario">{usuario.email}</span>
              <button type="button" className="header__sair" onClick={sair}>
                Sair
              </button>
            </>
          ) : (
            <NavLink to="/login" className="header__entrar">
              Entrar
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}

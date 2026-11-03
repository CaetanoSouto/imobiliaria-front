import { Link, NavLink } from 'react-router-dom'

export default function Header() {
  return (
    <header className="header">
      <div className="container header__conteudo">
        <Link to="/" className="header__marca">
          Imobiliária Iffar
        </Link>
        <nav className="header__menu">
          <NavLink to="/" end>
            Imóveis
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

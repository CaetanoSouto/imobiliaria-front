import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Página inicial do cliente: atalhos para ofertas, favoritos e contratos.
export default function AreaCliente() {
  const { usuario } = useAuth()
  return (
    <section className="container">
      <h1 className="pagina__titulo">Minha área</h1>
      <p>Olá, {usuario.email}. O que você quer ver?</p>
      <div className="atalhos">
        <Link to="/cliente/ofertas" className="atalho">
          <strong>Minhas ofertas</strong>
          <span>Acompanhe a situação de cada oferta</span>
        </Link>
        <Link to="/cliente/favoritos" className="atalho">
          <strong>Favoritos</strong>
          <span>Imóveis que você salvou</span>
        </Link>
        <Link to="/cliente/contratos" className="atalho">
          <strong>Contratos</strong>
          <span>Veja e assine seus contratos</span>
        </Link>
      </div>
    </section>
  )
}

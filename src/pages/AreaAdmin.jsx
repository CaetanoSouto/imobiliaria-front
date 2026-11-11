import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Painel inicial do admin. Os demais cadastros e os gráficos entram na semana 4.
export default function AreaAdmin() {
  const { usuario } = useAuth()
  return (
    <section className="container">
      <h1 className="pagina__titulo">Painel do administrador</h1>
      <p>Olá, {usuario.email}. Escolha uma área para gerenciar:</p>
      <div className="atalhos">
        <Link to="/admin/bairros" className="atalho">
          <strong>Bairros</strong>
          <span>Cadastrar, editar e excluir bairros</span>
        </Link>
      </div>
    </section>
  )
}

import { Link } from 'react-router-dom'

export default function AcessoNegado() {
  return (
    <section className="container feedback">
      <h1 className="pagina__titulo">Acesso negado</h1>
      <p>Você não tem permissão para ver esta página.</p>
      <Link to="/" className="botao">
        Voltar para a vitrine
      </Link>
    </section>
  )
}

import { Link } from 'react-router-dom'

export default function NaoEncontrada() {
  return (
    <section className="container feedback">
      <h1 className="pagina__titulo">Página não encontrada</h1>
      <Link to="/" className="botao">
        Voltar para a vitrine
      </Link>
    </section>
  )
}

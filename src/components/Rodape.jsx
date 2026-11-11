import { EMAIL_IMOBILIARIA } from '../utils/contato'
import { NOME_COMPLETO } from '../utils/marca'

export default function Rodape() {
  return (
    <footer className="rodape">
      <div className="container rodape__conteudo">
        <span>
          <strong>{NOME_COMPLETO}</strong> — compra, venda e aluguel com transparência.
        </span>
        <span>
          Contato: <a href={`mailto:${EMAIL_IMOBILIARIA}`}>{EMAIL_IMOBILIARIA}</a>
        </span>
      </div>
    </footer>
  )
}

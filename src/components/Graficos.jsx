import { Link } from 'react-router-dom'

// Blocos visuais dos painéis. Feitos em HTML/CSS (sem biblioteca): cada valor aparece
// escrito ao lado da barra, então a informação nunca depende só da cor.

// Número grande com legenda. Com `para`, vira um link; com `destaque`, chama atenção.
export function Indicador({ valor, rotulo, para, destaque = false }) {
  const classe = `indicador${destaque ? ' indicador--destaque' : ''}${para ? ' indicador--link' : ''}`
  const conteudo = (
    <>
      <strong>{valor}</strong>
      <span>{rotulo}</span>
    </>
  )
  return para ? (
    <Link to={para} className={classe}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  )
}

// Cartão de gráfico: título + conteúdo.
export function CartaoGrafico({ titulo, children }) {
  return (
    <section className="grafico" aria-label={titulo}>
      <h2 className="grafico__titulo">{titulo}</h2>
      {children}
    </section>
  )
}

// Barras horizontais: uma linha por categoria, rótulo à esquerda e valor à direita.
export function Barras({ dados }) {
  const total = dados.reduce((soma, d) => soma + d.valor, 0)
  if (total === 0) return <p className="grafico__vazio">Ainda não há dados para mostrar.</p>
  const maior = Math.max(...dados.map((d) => d.valor))

  return (
    <ul className="barras">
      {dados.map((d) => (
        <li key={d.chave} className="barras__linha" title={`${d.rotulo}: ${d.valor}`}>
          <span className="barras__rotulo">{d.rotulo}</span>
          <span className="barras__trilho" aria-hidden="true">
            <span
              className="barras__barra"
              style={{ width: `${(d.valor / maior) * 100}%`, background: d.cor }}
            />
          </span>
          <span className="barras__valor">{d.valor}</span>
        </li>
      ))}
    </ul>
  )
}

// Colunas verticais para uma série no tempo (ex.: ofertas por mês).
export function Colunas({ dados, cor }) {
  const total = dados.reduce((soma, d) => soma + d.valor, 0)
  if (total === 0) return <p className="grafico__vazio">Ainda não há dados para mostrar.</p>
  const maior = Math.max(...dados.map((d) => d.valor))

  return (
    <ul className="colunas">
      {dados.map((d) => (
        <li key={`${d.ano}-${d.mes}`} className="colunas__item" title={`${d.rotulo}: ${d.valor}`}>
          <span className="colunas__valor">{d.valor}</span>
          <span className="colunas__area" aria-hidden="true">
            <span
              className="colunas__coluna"
              style={{ height: `${(d.valor / maior) * 100}%`, background: cor }}
            />
          </span>
          <span className="colunas__rotulo">{d.rotulo}</span>
        </li>
      ))}
    </ul>
  )
}

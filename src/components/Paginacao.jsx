// Números a exibir: sempre a primeira, a última e uma janela ao redor da atual (null = reticências).
function numerosVisiveis(atual, total) {
  const paginas = new Set([1, total, atual - 1, atual, atual + 1])
  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const saida = []
  ordenadas.forEach((p, i) => {
    if (i > 0 && p - ordenadas[i - 1] > 1) saida.push(null)
    saida.push(p)
  })
  return saida
}

export default function Paginacao({ pagina, totalPaginas, onMudar }) {
  if (totalPaginas <= 1) return null

  return (
    <nav className="paginacao" aria-label="Paginação">
      <button type="button" className="botao botao--secundario" onClick={() => onMudar(pagina - 1)} disabled={pagina <= 1}>
        Anterior
      </button>
      <ul className="paginacao__numeros">
        {numerosVisiveis(pagina, totalPaginas).map((n, i) =>
          n === null ? (
            <li key={`reticencias-${i}`} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                className={`paginacao__numero${n === pagina ? ' paginacao__numero--ativo' : ''}`}
                onClick={() => onMudar(n)}
                aria-current={n === pagina ? 'page' : undefined}
                aria-label={`Página ${n}`}
              >
                {n}
              </button>
            </li>
          ),
        )}
      </ul>
      <button
        type="button"
        className="botao botao--secundario"
        onClick={() => onMudar(pagina + 1)}
        disabled={pagina >= totalPaginas}
      >
        Próxima
      </button>
    </nav>
  )
}

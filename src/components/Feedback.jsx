// Estados padrão de qualquer tela que busca dados: carregando, vazio e erro.

export function Carregando({ texto = 'Carregando...' }) {
  return (
    <div className="feedback" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{texto}</p>
    </div>
  )
}

export function SemResultados({ texto = 'Nenhum resultado encontrado.' }) {
  return (
    <div className="feedback">
      <p>{texto}</p>
    </div>
  )
}

export function MensagemErro({ texto, onTentarNovamente }) {
  return (
    <div className="feedback feedback--erro" role="alert">
      <p>{texto}</p>
      {onTentarNovamente && (
        <button type="button" className="botao" onClick={onTentarNovamente}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}

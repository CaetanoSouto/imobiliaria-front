import { useEffect } from 'react'

// Janela de confirmação (excluir, cancelar, assinar...). Fecha com Esc ou clicando fora.
export default function ConfirmarExclusao({
  titulo,
  texto,
  erro,
  excluindo,
  onConfirmar,
  onCancelar,
  textoConfirmar = 'Excluir',
  textoAndamento = 'Excluindo...',
  textoVoltar = 'Cancelar',
  perigo = true,
}) {
  useEffect(() => {
    const aoApertar = (e) => e.key === 'Escape' && !excluindo && onCancelar()
    window.addEventListener('keydown', aoApertar)
    return () => window.removeEventListener('keydown', aoApertar)
  }, [excluindo, onCancelar])

  return (
    <div className="modal" onClick={() => !excluindo && onCancelar()}>
      <div
        className="modal__caixa"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-titulo">{titulo}</h2>
        <p>{texto}</p>
        {erro && (
          <p className="aviso aviso--erro" role="alert">
            {erro}
          </p>
        )}
        <div className="modal__acoes">
          <button type="button" className="botao botao--secundario" onClick={onCancelar} disabled={excluindo}>
            {textoVoltar}
          </button>
          <button
            type="button"
            className={`botao${perigo ? ' botao--perigo' : ''}`}
            onClick={onConfirmar}
            disabled={excluindo}
          >
            {excluindo ? textoAndamento : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

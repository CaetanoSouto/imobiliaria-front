import { useState } from 'react'
import { validarFaixaPreco } from '../utils/imoveis'

// Barra de filtros e ordenação. Bairro, finalidade e ordem aplicam na hora;
// a faixa de preço é validada e aplicada pelo botão "Aplicar".
export default function Filtros({ params, bairros, onAlterar, onLimpar, temFiltro }) {
  const [min, setMin] = useState(params.min)
  const [max, setMax] = useState(params.max)
  const [erros, setErros] = useState({})

  // Mantém os campos de preço em sincronia quando a URL muda (limpar, voltar do navegador).
  const [ultimos, setUltimos] = useState({ min: params.min, max: params.max })
  if (ultimos.min !== params.min || ultimos.max !== params.max) {
    setUltimos({ min: params.min, max: params.max })
    setMin(params.min)
    setMax(params.max)
    setErros({})
  }

  const aplicarPreco = (e) => {
    e.preventDefault()
    const encontrados = validarFaixaPreco(min, max)
    setErros(encontrados)
    if (Object.keys(encontrados).length === 0) {
      onAlterar({ min: min.trim().replace(',', '.'), max: max.trim().replace(',', '.') })
    }
  }

  return (
    <form className="filtros" onSubmit={aplicarPreco} noValidate aria-label="Filtros de imóveis">
      <label className="campo">
        <span>Bairro</span>
        <select value={params.bairro} onChange={(e) => onAlterar({ bairro: e.target.value })}>
          <option value="">Todos os bairros</option>
          {bairros.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nome}
              {b.cidade ? ` — ${b.cidade}` : ''}
            </option>
          ))}
        </select>
      </label>

      <label className="campo">
        <span>Finalidade</span>
        <select value={params.finalidade} onChange={(e) => onAlterar({ finalidade: e.target.value })}>
          <option value="">Todas</option>
          <option value="ALUGUEL">Aluguel</option>
          <option value="VENDA">Venda</option>
        </select>
      </label>

      <label className="campo">
        <span>Preço mínimo (R$)</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          aria-invalid={Boolean(erros.min)}
        />
        {erros.min && <small className="campo__erro">{erros.min}</small>}
      </label>

      <label className="campo">
        <span>Preço máximo (R$)</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="Sem limite"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          aria-invalid={Boolean(erros.max)}
        />
        {erros.max && <small className="campo__erro">{erros.max}</small>}
      </label>

      <label className="campo">
        <span>Ordenar por</span>
        <select value={params.ordem} onChange={(e) => onAlterar({ ordem: e.target.value })}>
          <option value="">Padrão</option>
          <option value="preco-asc">Menor preço</option>
          <option value="preco-desc">Maior preço</option>
        </select>
      </label>

      <div className="filtros__acoes">
        <button type="submit" className="botao">
          Aplicar preço
        </button>
        <button type="button" className="botao botao--secundario" onClick={onLimpar} disabled={!temFiltro && !params.ordem}>
          Limpar filtros
        </button>
      </div>
    </form>
  )
}

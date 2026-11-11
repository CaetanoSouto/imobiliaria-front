import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { adicionarFavorito, criarOferta, listarFavoritos, removerFavorito } from '../services/clienteService'
import { mensagemErro } from '../utils/erros'
import { formatarPreco } from '../utils/formatar'
import { rotuloFinalidade, valorImovel } from '../utils/imoveis'

// Ações do detalhe do imóvel para o cliente: favoritar e fazer oferta.
// "Fazer oferta" só existe para imóveis DISPONÍVEIS (reservado, alugado e vendido não mostram o botão).
export default function AcoesCliente({ imovel }) {
  const { autenticado, usuario } = useAuth()
  const local = useLocation()
  const disponivel = imovel.status === 'DISPONIVEL'
  const ehCliente = autenticado && usuario.tipo === 'USER'

  const [favorito, setFavorito] = useState(false)
  const [erroFavorito, setErroFavorito] = useState(null)
  const [aberto, setAberto] = useState(false)
  const [valor, setValor] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erroValor, setErroValor] = useState(null)
  const [erroApi, setErroApi] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [enviada, setEnviada] = useState(false)

  // Descobre se o imóvel já está nos favoritos do cliente.
  useEffect(() => {
    if (!ehCliente) return undefined
    let ativo = true
    listarFavoritos()
      .then((lista) => ativo && setFavorito(lista.some((f) => f.imovel?.id === imovel.id)))
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [ehCliente, imovel.id])

  if (!autenticado) {
    return disponivel ? (
      <Link className="botao botao--secundario botao--bloco" to="/login" state={{ de: local.pathname }}>
        Entre para fazer uma oferta
      </Link>
    ) : null
  }
  if (!ehCliente) return null // admin não faz ofertas

  const alternarFavorito = async () => {
    setErroFavorito(null)
    try {
      if (favorito) await removerFavorito(imovel.id)
      else await adicionarFavorito(imovel.id)
      setFavorito(!favorito)
    } catch (e) {
      setErroFavorito(mensagemErro(e))
    }
  }

  const abrirFormulario = () => {
    setValor(String(valorImovel(imovel) ?? ''))
    setErroValor(null)
    setErroApi(null)
    setEnviada(false)
    setAberto(true)
  }

  const enviar = async (e) => {
    e.preventDefault()
    setErroApi(null)
    const numero = Number(String(valor).replace(',', '.'))
    if (!String(valor).trim() || !Number.isFinite(numero) || numero <= 0) {
      setErroValor('Informe um valor válido, maior que zero.')
      return
    }
    setErroValor(null)
    setEnviando(true)
    try {
      await criarOferta({
        imovelId: imovel.id,
        tipo: imovel.finalidade === 'VENDA' ? 'VENDA' : 'ALUGUEL',
        valorProposto: numero,
        mensagem: mensagem.trim() || null,
      })
      setEnviada(true)
      setAberto(false)
      setMensagem('')
    } catch (err) {
      // 409 traz a regra de negócio (ex.: já existe oferta pendente, imóvel indisponível)
      setErroApi(mensagemErro(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="acoes">
      <button type="button" className="botao botao--secundario botao--bloco" onClick={alternarFavorito} aria-pressed={favorito}>
        {favorito ? '♥ Remover dos favoritos' : '♡ Adicionar aos favoritos'}
      </button>
      {erroFavorito && (
        <p className="aviso aviso--erro" role="alert">
          {erroFavorito}
        </p>
      )}

      {enviada && (
        <p className="aviso aviso--sucesso" role="status">
          Oferta enviada! Acompanhe em <Link to="/cliente/ofertas">Minhas ofertas</Link>.
        </p>
      )}

      {disponivel && !aberto && (
        <button type="button" className="botao botao--bloco" onClick={abrirFormulario}>
          Fazer oferta
        </button>
      )}

      {disponivel && aberto && (
        <form className="oferta" onSubmit={enviar} noValidate>
          <h2>Fazer oferta de {rotuloFinalidade(imovel.finalidade).toLowerCase()}</h2>
          {erroApi && (
            <p className="aviso aviso--erro" role="alert">
              {erroApi}
            </p>
          )}
          <label className="campo">
            <span>Valor proposto (R$)</span>
            <input
              type="text"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              aria-invalid={Boolean(erroValor)}
            />
            <small className="campo__dica">Valor anunciado: {formatarPreco(valorImovel(imovel))}</small>
            {erroValor && <small className="campo__erro">{erroValor}</small>}
          </label>
          <label className="campo">
            <span>Mensagem (opcional)</span>
            <textarea rows={3} value={mensagem} onChange={(e) => setMensagem(e.target.value)} maxLength={500} />
          </label>
          <div className="formulario__acoes">
            <button type="submit" className="botao" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar oferta'}
            </button>
            <button type="button" className="botao botao--secundario" onClick={() => setAberto(false)} disabled={enviando}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

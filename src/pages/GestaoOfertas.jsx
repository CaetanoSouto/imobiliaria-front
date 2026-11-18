import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ConfirmarExclusao from '../components/ConfirmarExclusao'
import { Carregando, MensagemErro, SemResultados } from '../components/Feedback'
import { useCarregar } from '../hooks/useCarregar'
import { aceitarOferta, listarOfertas, recusarOferta } from '../services/gestaoService'
import { mensagemErro } from '../utils/erros'
import { formatarData, formatarPreco, rotuloOferta } from '../utils/formatar'
import { rotuloFinalidade } from '../utils/imoveis'
import { SITUACOES_OFERTA } from '../utils/painel'

// Janela para aceitar: o corretor pode escrever as condições que vão no contrato.
function AceitarOferta({ oferta, erro, enviando, onConfirmar, onCancelar }) {
  const [condicoes, setCondicoes] = useState('')

  useEffect(() => {
    const aoApertar = (e) => e.key === 'Escape' && !enviando && onCancelar()
    window.addEventListener('keydown', aoApertar)
    return () => window.removeEventListener('keydown', aoApertar)
  }, [enviando, onCancelar])

  return (
    <div className="modal" onClick={() => !enviando && onCancelar()}>
      <div
        className="modal__caixa"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aceitar-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="aceitar-titulo">Aceitar oferta e preparar contrato?</h2>
        <p>
          Oferta de {formatarPreco(oferta.valorProposto)} de {oferta.usuario?.nome || oferta.usuario?.email} para
          &quot;{oferta.imovel.titulo}&quot;. O imóvel fica reservado, as outras ofertas ficam em espera e o contrato
          segue para a aprovação do administrador.
        </p>
        <label className="campo">
          <span>Condições do contrato (opcional)</span>
          <textarea
            rows={4}
            value={condicoes}
            maxLength={1000}
            placeholder="Ex.: entrada de 20%, prazo de 30 meses, reajuste anual pelo IGP-M."
            onChange={(e) => setCondicoes(e.target.value)}
            disabled={enviando}
          />
        </label>
        {erro && (
          <p className="aviso aviso--erro" role="alert">
            {erro}
          </p>
        )}
        <div className="modal__acoes">
          <button type="button" className="botao botao--secundario" onClick={onCancelar} disabled={enviando}>
            Voltar
          </button>
          <button type="button" className="botao" onClick={() => onConfirmar(condicoes)} disabled={enviando}>
            {enviando ? 'Preparando...' : 'Aceitar e preparar contrato'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Lista as ofertas de todos os clientes. Com `podeDecidir` (corretor) mostra aceitar e recusar;
// sem ele (admin) é só consulta.
export default function GestaoOfertas({ podeDecidir = false }) {
  const [params, setParams] = useSearchParams()
  const filtro = params.get('status') || ''
  const { dados, carregando, erro, recarregar } = useCarregar(() => listarOfertas(filtro), [filtro])

  const [aceitar, setAceitar] = useState(null)
  const [recusar, setRecusar] = useState(null)
  const [erroAcao, setErroAcao] = useState(null)
  const [processando, setProcessando] = useState(false)
  const [sucesso, setSucesso] = useState(null)

  const fechar = () => {
    setAceitar(null)
    setRecusar(null)
    setErroAcao(null)
  }

  // `mensagem` pode ser uma função: aceitar e recusar dizem se o e-mail ao cliente saiu.
  const executar = async (acao, mensagem) => {
    setProcessando(true)
    setErroAcao(null)
    try {
      const resultado = await acao()
      setSucesso(typeof mensagem === 'function' ? mensagem(resultado) : mensagem)
      fechar()
      recarregar()
    } catch (e) {
      setErroAcao(mensagemErro(e))
    } finally {
      setProcessando(false)
    }
  }

  const trocarFiltro = (status) => {
    setSucesso(null)
    setParams(status ? { status } : {})
  }

  return (
    <section className="container">
      <h1 className="pagina__titulo">{podeDecidir ? 'Ofertas recebidas' : 'Ofertas'}</h1>

      <div className="filtros filtros--simples">
        <label className="campo">
          <span>Situação</span>
          <select value={filtro} onChange={(e) => trocarFiltro(e.target.value)}>
            <option value="">Todas</option>
            {SITUACOES_OFERTA.map((s) => (
              <option key={s.chave} value={s.chave}>
                {rotuloOferta(s.chave)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sucesso && (
        <p className="aviso aviso--sucesso" role="status">
          {sucesso}
        </p>
      )}

      {carregando && <Carregando texto="Carregando ofertas..." />}
      {!carregando && erro && <MensagemErro texto={erro.mensagem} onTentarNovamente={recarregar} />}
      {!carregando && !erro && dados?.length === 0 && (
        <SemResultados texto={filtro ? 'Nenhuma oferta com essa situação.' : 'Nenhuma oferta recebida ainda.'} />
      )}

      {!carregando && !erro && dados?.length > 0 && (
        <div className="tabela__rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Imóvel</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Valor proposto</th>
                <th>Mensagem</th>
                <th>Situação</th>
                <th>Enviada em</th>
                {podeDecidir && <th aria-label="Ações" />}
              </tr>
            </thead>
            <tbody>
              {dados.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/imoveis/${o.imovel.id}`}>{o.imovel.titulo || `Imóvel ${o.imovel.id}`}</Link>
                  </td>
                  <td>{o.usuario?.nome || o.usuario?.email}</td>
                  <td>{rotuloFinalidade(o.tipo)}</td>
                  <td>{formatarPreco(o.valorProposto)}</td>
                  <td className="tabela__texto" title={o.mensagem || ''}>
                    {o.mensagem || '—'}
                  </td>
                  <td>
                    <span className={`badge badge--${o.status.toLowerCase()}`}>{rotuloOferta(o.status)}</span>
                  </td>
                  <td>{formatarData(o.dataCriacao)}</td>
                  {podeDecidir && (
                    <td className="tabela__acoes">
                      {o.status === 'PENDENTE' && (
                        <button
                          type="button"
                          className="botao botao--pequeno"
                          onClick={() => {
                            setSucesso(null)
                            setAceitar(o)
                          }}
                        >
                          Aceitar
                        </button>
                      )}
                      {(o.status === 'PENDENTE' || o.status === 'EM_ESPERA') && (
                        <button
                          type="button"
                          className="botao botao--perigo-contorno botao--pequeno"
                          onClick={() => {
                            setSucesso(null)
                            setRecusar(o)
                          }}
                        >
                          Recusar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aceitar && (
        <AceitarOferta
          oferta={aceitar}
          erro={erroAcao}
          enviando={processando}
          onConfirmar={(condicoes) =>
            executar(
              () => aceitarOferta(aceitar.id, condicoes.trim()),
              (o) =>
                `Oferta aceita. O contrato foi preparado e aguarda a aprovação do administrador. ${
                  o?.emailEnviado
                    ? 'O cliente foi avisado por e-mail.'
                    : 'O e-mail ao cliente NÃO foi enviado (SMTP não configurado ou fora do ar).'
                }`,
            )
          }
          onCancelar={fechar}
        />
      )}

      {recusar && (
        <ConfirmarExclusao
          titulo="Recusar oferta?"
          texto={`Deseja recusar a oferta de ${formatarPreco(recusar.valorProposto)} para "${recusar.imovel.titulo}"? O cliente verá a oferta como recusada.`}
          erro={erroAcao}
          excluindo={processando}
          textoConfirmar="Recusar oferta"
          textoAndamento="Recusando..."
          textoVoltar="Voltar"
          onConfirmar={() =>
            executar(
              () => recusarOferta(recusar.id),
              (o) =>
                `Oferta recusada. ${
                  o?.emailEnviado
                    ? 'O cliente foi avisado por e-mail.'
                    : 'O e-mail ao cliente NÃO foi enviado (SMTP não configurado ou fora do ar).'
                }`,
            )
          }
          onCancelar={fechar}
        />
      )}
    </section>
  )
}

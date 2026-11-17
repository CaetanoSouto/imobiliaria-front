import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ConfirmarExclusao from '../components/ConfirmarExclusao'
import { Carregando, MensagemErro, SemResultados } from '../components/Feedback'
import { useCarregar } from '../hooks/useCarregar'
import { aprovarContrato, cancelarContrato, listarContratos } from '../services/gestaoService'
import { baixarPdfContrato } from '../utils/download'
import { mensagemErro } from '../utils/erros'
import { formatarData, formatarPreco, rotuloContrato } from '../utils/formatar'
import { rotuloFinalidade } from '../utils/imoveis'
import { SITUACOES_CONTRATO } from '../utils/painel'

// Lista os contratos de todos os clientes. Com `podeDecidir` (admin) mostra aprovar e
// cancelar; sem ele (corretor) é só acompanhamento do que foi preparado.
export default function GestaoContratos({ podeDecidir = false }) {
  const [params, setParams] = useSearchParams()
  const filtro = params.get('status') || ''
  const { dados, carregando, erro, recarregar } = useCarregar(listarContratos)

  const [aprovar, setAprovar] = useState(null)
  const [cancelar, setCancelar] = useState(null)
  const [erroAcao, setErroAcao] = useState(null)
  const [processando, setProcessando] = useState(false)
  const [sucesso, setSucesso] = useState(null)
  const [baixando, setBaixando] = useState(null) // id do contrato com download em andamento
  const [erroPdf, setErroPdf] = useState(null)

  const fechar = () => {
    setAprovar(null)
    setCancelar(null)
    setErroAcao(null)
  }

  // `mensagem` pode ser uma função: aprovar e cancelar dizem se o e-mail ao cliente saiu.
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

  const baixar = async (contrato) => {
    setSucesso(null)
    setErroPdf(null)
    setBaixando(contrato.id)
    try {
      await baixarPdfContrato(contrato.id)
    } catch (e) {
      setErroPdf(mensagemErro(e))
    } finally {
      setBaixando(null)
    }
  }

  const trocarFiltro = (status) => {
    setSucesso(null)
    setParams(status ? { status } : {})
  }

  const visiveis = (dados || []).filter((c) => !filtro || c.status === filtro)
  const aguardandoAprovacao = cancelar?.status === 'AGUARDANDO_APROVACAO'

  return (
    <section className="container">
      <h1 className="pagina__titulo">Contratos</h1>

      <div className="filtros filtros--simples">
        <label className="campo">
          <span>Situação</span>
          <select value={filtro} onChange={(e) => trocarFiltro(e.target.value)}>
            <option value="">Todas</option>
            {SITUACOES_CONTRATO.map((s) => (
              <option key={s.chave} value={s.chave}>
                {rotuloContrato(s.chave)}
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

      {erroPdf && (
        <p className="aviso aviso--erro" role="alert">
          {erroPdf}
        </p>
      )}

      {carregando && <Carregando texto="Carregando contratos..." />}
      {!carregando && erro && <MensagemErro texto={erro.mensagem} onTentarNovamente={recarregar} />}
      {!carregando && !erro && visiveis.length === 0 && (
        <SemResultados
          texto={
            filtro
              ? 'Nenhum contrato com essa situação.'
              : 'Nenhum contrato ainda. Eles aparecem aqui quando o corretor aceita uma oferta.'
          }
        />
      )}

      {!carregando && !erro && visiveis.length > 0 && (
        <div className="tabela__rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Imóvel</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Condições</th>
                <th>Situação</th>
                <th>Preparado em</th>
                <th>Aprovado em</th>
                <th>Assinado em</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {visiveis.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/imoveis/${c.oferta.imovel.id}`}>
                      {c.oferta.imovel.titulo || `Imóvel ${c.oferta.imovel.id}`}
                    </Link>
                  </td>
                  <td>{c.oferta.usuario?.nome || c.oferta.usuario?.email}</td>
                  <td>{rotuloFinalidade(c.oferta.tipo)}</td>
                  <td>{formatarPreco(c.oferta.valorProposto)}</td>
                  <td className="tabela__texto" title={c.condicoes || ''}>
                    {c.condicoes || '—'}
                  </td>
                  <td>
                    <span className={`badge badge--${c.status.toLowerCase()}`}>{rotuloContrato(c.status)}</span>
                  </td>
                  <td>{formatarData(c.dataCriacao)}</td>
                  <td>{formatarData(c.dataAprovacao)}</td>
                  <td>{formatarData(c.dataAssinatura)}</td>
                  <td className="tabela__acoes">
                    <button
                      type="button"
                      className="botao botao--secundario botao--pequeno"
                      disabled={baixando === c.id}
                      onClick={() => baixar(c)}
                    >
                      {baixando === c.id ? 'Baixando...' : 'Baixar PDF'}
                    </button>
                    {podeDecidir && (
                      <>
                      {c.status === 'AGUARDANDO_APROVACAO' && (
                        <button
                          type="button"
                          className="botao botao--pequeno"
                          onClick={() => {
                            setSucesso(null)
                            setAprovar(c)
                          }}
                        >
                          Aprovar
                        </button>
                      )}
                      {(c.status === 'AGUARDANDO_APROVACAO' || c.status === 'AGUARDANDO_ASSINATURA') && (
                        <button
                          type="button"
                          className="botao botao--perigo-contorno botao--pequeno"
                          onClick={() => {
                            setSucesso(null)
                            setCancelar(c)
                          }}
                        >
                          {c.status === 'AGUARDANDO_APROVACAO' ? 'Reprovar' : 'Cancelar'}
                        </button>
                      )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aprovar && (
        <ConfirmarExclusao
          titulo="Aprovar contrato?"
          texto={`Ao aprovar, o contrato de "${aprovar.oferta.imovel.titulo}" é liberado para ${
            aprovar.oferta.usuario?.nome || aprovar.oferta.usuario?.email
          } assinar.`}
          erro={erroAcao}
          excluindo={processando}
          perigo={false}
          textoConfirmar="Aprovar contrato"
          textoAndamento="Aprovando..."
          textoVoltar="Voltar"
          onConfirmar={() =>
            executar(
              () => aprovarContrato(aprovar.id),
              (c) =>
                c?.emailEnviado
                  ? 'Contrato aprovado. O cliente foi avisado por e-mail, com o PDF em anexo, e já pode assinar.'
                  : 'Contrato aprovado e liberado para assinatura, mas o e-mail NÃO foi enviado (SMTP não configurado ou fora do ar). Avise o cliente por outro meio.',
            )
          }
          onCancelar={fechar}
        />
      )}

      {cancelar && (
        <ConfirmarExclusao
          titulo={aguardandoAprovacao ? 'Reprovar contrato?' : 'Cancelar contrato?'}
          texto={`O contrato de "${cancelar.oferta.imovel.titulo}" será cancelado, a oferta ficará cancelada e o imóvel volta a ficar disponível. As ofertas em espera voltam a ficar pendentes.`}
          erro={erroAcao}
          excluindo={processando}
          textoConfirmar={aguardandoAprovacao ? 'Reprovar contrato' : 'Cancelar contrato'}
          textoAndamento="Cancelando..."
          textoVoltar="Voltar"
          onConfirmar={() =>
            executar(
              () => cancelarContrato(cancelar.id),
              (c) =>
                c?.emailEnviado
                  ? 'Contrato cancelado. O cliente foi avisado por e-mail.'
                  : 'Contrato cancelado, mas o e-mail NÃO foi enviado (SMTP não configurado ou fora do ar). Avise o cliente por outro meio.',
            )
          }
          onCancelar={fechar}
        />
      )}
    </section>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmarExclusao from '../../components/ConfirmarExclusao'
import { Carregando, MensagemErro, SemResultados } from '../../components/Feedback'
import { useCarregar } from '../../hooks/useCarregar'
import { assinarContrato, listarMeusContratos } from '../../services/clienteService'
import { mensagemErro } from '../../utils/erros'
import { formatarData, formatarPreco, rotuloContrato } from '../../utils/formatar'
import { rotuloFinalidade } from '../../utils/imoveis'

export default function MeusContratos() {
  const { dados, carregando, erro, recarregar } = useCarregar(listarMeusContratos)
  const [assinar, setAssinar] = useState(null)
  const [erroAssinar, setErroAssinar] = useState(null)
  const [assinando, setAssinando] = useState(false)
  const [sucesso, setSucesso] = useState(null)

  const confirmar = async () => {
    setAssinando(true)
    setErroAssinar(null)
    try {
      await assinarContrato(assinar.id)
      setSucesso('Contrato assinado com sucesso.')
      setAssinar(null)
      recarregar()
    } catch (e) {
      setErroAssinar(mensagemErro(e))
    } finally {
      setAssinando(false)
    }
  }

  return (
    <section className="container">
      <h1 className="pagina__titulo">Meus contratos</h1>

      {sucesso && (
        <p className="aviso aviso--sucesso" role="status">
          {sucesso}
        </p>
      )}

      {carregando && <Carregando texto="Carregando contratos..." />}
      {!carregando && erro && <MensagemErro texto={erro.mensagem} onTentarNovamente={recarregar} />}
      {!carregando && !erro && dados?.length === 0 && (
        <SemResultados texto="Você ainda não tem contratos. Eles aparecem aqui quando uma oferta sua é aceita." />
      )}

      {!carregando && !erro && dados?.length > 0 && (
        <div className="tabela__rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Imóvel</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Situação</th>
                <th>Assinado em</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {dados.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/imoveis/${c.oferta.imovel.id}`}>
                      {c.oferta.imovel.titulo || `Imóvel ${c.oferta.imovel.id}`}
                    </Link>
                  </td>
                  <td>{rotuloFinalidade(c.oferta.tipo)}</td>
                  <td>{formatarPreco(c.oferta.valorProposto)}</td>
                  <td>
                    <span className={`badge badge--${c.status.toLowerCase()}`}>{rotuloContrato(c.status)}</span>
                  </td>
                  <td>{formatarData(c.dataAssinatura)}</td>
                  <td className="tabela__acoes">
                    {c.status === 'AGUARDANDO_ASSINATURA' && (
                      <button
                        type="button"
                        className="botao botao--pequeno"
                        onClick={() => {
                          setSucesso(null)
                          setAssinar(c)
                        }}
                      >
                        Assinar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {assinar && (
        <ConfirmarExclusao
          titulo="Assinar contrato?"
          texto={`Ao assinar, o imóvel "${assinar.oferta.imovel.titulo}" será ${
            assinar.oferta.tipo === 'VENDA' ? 'vendido' : 'alugado'
          } para você e as outras ofertas dele serão recusadas.`}
          erro={erroAssinar}
          excluindo={assinando}
          perigo={false}
          textoConfirmar="Assinar contrato"
          textoAndamento="Assinando..."
          textoVoltar="Voltar"
          onConfirmar={confirmar}
          onCancelar={() => {
            setAssinar(null)
            setErroAssinar(null)
          }}
        />
      )}
    </section>
  )
}

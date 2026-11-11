import { useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmarExclusao from '../../components/ConfirmarExclusao'
import { Carregando, MensagemErro } from '../../components/Feedback'
import { useCarregar } from '../../hooks/useCarregar'
import { cancelarOferta, listarMinhasOfertas } from '../../services/clienteService'
import { mensagemErro } from '../../utils/erros'
import { formatarData, formatarPreco, rotuloOferta } from '../../utils/formatar'
import { rotuloFinalidade } from '../../utils/imoveis'

export default function MinhasOfertas() {
  const { dados, carregando, erro, recarregar } = useCarregar(listarMinhasOfertas)
  const [cancelar, setCancelar] = useState(null)
  const [erroCancelar, setErroCancelar] = useState(null)
  const [cancelando, setCancelando] = useState(false)
  const [sucesso, setSucesso] = useState(null)

  const confirmar = async () => {
    setCancelando(true)
    setErroCancelar(null)
    try {
      await cancelarOferta(cancelar.id)
      setSucesso('Oferta cancelada.')
      setCancelar(null)
      recarregar()
    } catch (e) {
      setErroCancelar(mensagemErro(e))
    } finally {
      setCancelando(false)
    }
  }

  return (
    <section className="container">
      <h1 className="pagina__titulo">Minhas ofertas</h1>

      {sucesso && (
        <p className="aviso aviso--sucesso" role="status">
          {sucesso}
        </p>
      )}

      {carregando && <Carregando texto="Carregando suas ofertas..." />}
      {!carregando && erro && <MensagemErro texto={erro.mensagem} onTentarNovamente={recarregar} />}
      {!carregando && !erro && dados?.length === 0 && (
        <div className="feedback">
          <p>Você ainda não fez nenhuma oferta.</p>
          <Link to="/" className="botao">
            Ver imóveis
          </Link>
        </div>
      )}

      {!carregando && !erro && dados?.length > 0 && (
        <div className="tabela__rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Imóvel</th>
                <th>Tipo</th>
                <th>Valor proposto</th>
                <th>Situação</th>
                <th>Enviada em</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {dados.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/imoveis/${o.imovel.id}`}>{o.imovel.titulo || `Imóvel ${o.imovel.id}`}</Link>
                  </td>
                  <td>{rotuloFinalidade(o.tipo)}</td>
                  <td>{formatarPreco(o.valorProposto)}</td>
                  <td>
                    <span className={`badge badge--${o.status.toLowerCase()}`}>{rotuloOferta(o.status)}</span>
                  </td>
                  <td>{formatarData(o.dataCriacao)}</td>
                  <td className="tabela__acoes">
                    {(o.status === 'PENDENTE' || o.status === 'EM_ESPERA') && (
                      <button
                        type="button"
                        className="botao botao--perigo-contorno botao--pequeno"
                        onClick={() => {
                          setSucesso(null)
                          setCancelar(o)
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cancelar && (
        <ConfirmarExclusao
          titulo="Cancelar oferta?"
          texto={`Deseja cancelar sua oferta de ${formatarPreco(cancelar.valorProposto)} para "${cancelar.imovel.titulo}"?`}
          erro={erroCancelar}
          excluindo={cancelando}
          textoConfirmar="Cancelar oferta"
          textoAndamento="Cancelando..."
          textoVoltar="Voltar"
          onConfirmar={confirmar}
          onCancelar={() => {
            setCancelar(null)
            setErroCancelar(null)
          }}
        />
      )}
    </section>
  )
}

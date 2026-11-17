import { Link } from 'react-router-dom'
import { Carregando, MensagemErro } from '../components/Feedback'
import { Barras, CartaoGrafico, Indicador } from '../components/Graficos'
import { useAuth } from '../context/AuthContext'
import { useCarregar } from '../hooks/useCarregar'
import { listarFavoritos, listarMeusContratos, listarMinhasOfertas } from '../services/clienteService'
import { contar, ofertasPorSituacao } from '../utils/painel'

// Página inicial do cliente: resumo das suas ofertas, contratos e favoritos, com atalhos.
export default function AreaCliente() {
  const { usuario } = useAuth()
  const { dados, carregando, erro, recarregar } = useCarregar(() =>
    Promise.all([listarMinhasOfertas(), listarMeusContratos(), listarFavoritos()]),
  )
  const [ofertas, contratos, favoritos] = dados || [[], [], []]
  const paraAssinar = contar(contratos, 'AGUARDANDO_ASSINATURA')

  return (
    <section className="container">
      <h1 className="pagina__titulo">Minha área</h1>
      <p>Olá, {usuario.email}. Veja como estão suas ofertas e contratos:</p>

      {carregando && <Carregando texto="Carregando seu resumo..." />}
      {!carregando && erro && <MensagemErro texto={erro.mensagem} onTentarNovamente={recarregar} />}

      {!carregando && !erro && (
        <>
          <div className="indicadores">
            <Indicador
              valor={paraAssinar}
              rotulo={paraAssinar === 1 ? 'contrato para assinar' : 'contratos para assinar'}
              para="/cliente/contratos"
              destaque={paraAssinar > 0}
            />
            <Indicador
              valor={contar(ofertas, 'PENDENTE') + contar(ofertas, 'EM_ESPERA')}
              rotulo="ofertas em andamento"
              para="/cliente/ofertas"
            />
            <Indicador valor={contar(contratos, 'ASSINADO')} rotulo="contratos assinados" />
            <Indicador valor={favoritos.length} rotulo="imóveis favoritos" para="/cliente/favoritos" />
          </div>

          <div className="graficos">
            <CartaoGrafico titulo="Minhas ofertas por situação">
              <Barras dados={ofertasPorSituacao(ofertas)} />
            </CartaoGrafico>
          </div>
        </>
      )}

      <div className="atalhos">
        <Link to="/cliente/ofertas" className="atalho">
          <strong>Minhas ofertas</strong>
          <span>Acompanhe a situação de cada oferta</span>
        </Link>
        <Link to="/cliente/favoritos" className="atalho">
          <strong>Favoritos</strong>
          <span>Imóveis que você salvou</span>
        </Link>
        <Link to="/cliente/contratos" className="atalho">
          <strong>Contratos</strong>
          <span>Veja e assine seus contratos</span>
        </Link>
      </div>
    </section>
  )
}

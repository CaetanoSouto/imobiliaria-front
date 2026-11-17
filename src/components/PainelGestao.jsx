import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCarregar } from '../hooks/useCarregar'
import { listarImoveis } from '../services/imoveisService'
import { listarContratos, listarOfertas } from '../services/gestaoService'
import { formatarPreco } from '../utils/formatar'
import {
  COR_SERIE,
  contar,
  contratosPorSituacao,
  imoveisPorBairro,
  imoveisPorFinalidade,
  imoveisPorSituacao,
  ofertasPorMes,
  ofertasPorSituacao,
  valorAssinado,
} from '../utils/painel'
import { Barras, CartaoGrafico, Colunas, Indicador } from './Graficos'
import { Carregando, MensagemErro } from './Feedback'

// Painel de quem gerencia (corretor e admin): indicadores e gráficos de ofertas,
// contratos e imóveis. `perfil` só muda os atalhos e qual pendência é destacada.
export default function PainelGestao({ titulo, perfil, links, atalhos }) {
  const { usuario } = useAuth()
  const { dados, carregando, erro, recarregar } = useCarregar(() =>
    Promise.all([listarOfertas(), listarContratos(), listarImoveis()]),
  )

  const [ofertas, contratos, imoveis] = dados || [[], [], []]
  const pendentes = contar(ofertas, 'PENDENTE')
  const paraAprovar = contar(contratos, 'AGUARDANDO_APROVACAO')
  const paraAssinar = contar(contratos, 'AGUARDANDO_ASSINATURA')

  return (
    <section className="container">
      <h1 className="pagina__titulo">{titulo}</h1>
      <p>Olá, {usuario.email}.</p>

      {carregando && <Carregando texto="Carregando o painel..." />}
      {!carregando && erro && <MensagemErro texto={erro.mensagem} onTentarNovamente={recarregar} />}

      {!carregando && !erro && (
        <>
          <div className="indicadores">
            <Indicador
              valor={pendentes}
              rotulo={pendentes === 1 ? 'oferta pendente' : 'ofertas pendentes'}
              para={links.ofertas}
              destaque={perfil === 'CORRETOR' && pendentes > 0}
            />
            <Indicador
              valor={paraAprovar}
              rotulo={paraAprovar === 1 ? 'contrato para aprovar' : 'contratos para aprovar'}
              para={links.contratos}
              destaque={perfil === 'ADMIN' && paraAprovar > 0}
            />
            <Indicador
              valor={paraAssinar}
              rotulo={paraAssinar === 1 ? 'contrato aguardando assinatura' : 'contratos aguardando assinatura'}
              para={links.contratos}
            />
            <Indicador valor={contar(contratos, 'ASSINADO')} rotulo="contratos assinados" />
            <Indicador valor={formatarPreco(valorAssinado(contratos))} rotulo="em contratos assinados" />
            <Indicador valor={imoveis.filter((i) => (i.status || 'DISPONIVEL') === 'DISPONIVEL').length} rotulo="imóveis disponíveis" />
          </div>

          <div className="graficos">
            <CartaoGrafico titulo="Ofertas por situação">
              <Barras dados={ofertasPorSituacao(ofertas)} />
            </CartaoGrafico>
            <CartaoGrafico titulo="Contratos por situação">
              <Barras dados={contratosPorSituacao(contratos)} />
            </CartaoGrafico>
            <CartaoGrafico titulo="Ofertas recebidas por mês">
              <Colunas dados={ofertasPorMes(ofertas)} cor={COR_SERIE} />
            </CartaoGrafico>
            <CartaoGrafico titulo="Imóveis por bairro">
              <Barras dados={imoveisPorBairro(imoveis)} />
            </CartaoGrafico>
            <CartaoGrafico titulo="Imóveis por finalidade">
              <Barras dados={imoveisPorFinalidade(imoveis)} />
            </CartaoGrafico>
            <CartaoGrafico titulo="Imóveis por situação">
              <Barras dados={imoveisPorSituacao(imoveis)} />
            </CartaoGrafico>
          </div>
        </>
      )}

      <div className="atalhos">
        {atalhos.map((a) => (
          <Link key={a.para} to={a.para} className="atalho">
            <strong>{a.titulo}</strong>
            <span>{a.descricao}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

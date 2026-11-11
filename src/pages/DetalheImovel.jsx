import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import AcoesCliente from '../components/AcoesCliente'
import FotoComFallback from '../components/FotoComFallback'
import Galeria from '../components/Galeria'
import { Carregando, MensagemErro } from '../components/Feedback'
import { useCarregar } from '../hooks/useCarregar'
import { buscarImovel } from '../services/imoveisService'
import { formatarPreco, rotuloStatus } from '../utils/formatar'
import { fotosDoImovel, rotuloFinalidade, valorImovel } from '../utils/imoveis'
import { montarLinkContato } from '../utils/contato'

const numero = new Intl.NumberFormat('pt-BR')

function Dado({ rotulo, valor }) {
  if (valor === null || valor === undefined || valor === '') return null
  return (
    <div className="dado">
      <dt>{rotulo}</dt>
      <dd>{valor}</dd>
    </div>
  )
}

const area = (valor) => (valor ? `${numero.format(Number(valor))} m²` : null)

export default function DetalheImovel() {
  const { id } = useParams()
  const buscar = useCallback(() => buscarImovel(id), [id])
  const { dados: imovel, carregando, erro, recarregar } = useCarregar(buscar, [id])

  if (carregando) return <section className="container"><Carregando texto="Carregando imóvel..." /></section>

  if (erro?.status === 404) {
    return (
      <section className="container feedback">
        <h1 className="pagina__titulo">Imóvel não encontrado</h1>
        <p>O imóvel que você procura não existe ou foi removido.</p>
        <Link to="/" className="botao">
          Voltar para a vitrine
        </Link>
      </section>
    )
  }

  if (erro) {
    return (
      <section className="container">
        <MensagemErro texto={erro.mensagem} onTentarNovamente={recarregar} />
        <p className="centralizado">
          <Link to="/">Voltar para a vitrine</Link>
        </p>
      </section>
    )
  }

  if (!imovel) return null

  const fotos = fotosDoImovel(imovel)
  const valor = valorImovel(imovel)
  const disponivel = imovel.status === 'DISPONIVEL'
  const enderecoCompleto = [imovel.endereco, imovel.numero, imovel.complemento].filter(Boolean).join(', ')
  const linkContato = montarLinkContato(imovel)

  return (
    <section className="container detalhe">
      <p>
        <Link to="/">← Voltar para a vitrine</Link>
      </p>

      <div className="detalhe__layout">
        <div>
          {fotos.length > 0 ? (
            <Galeria fotos={fotos} titulo={imovel.titulo || `Imóvel ${imovel.id}`} />
          ) : (
            <div className="galeria__principal">
              <FotoComFallback src={null} alt={imovel.titulo || `Imóvel ${imovel.id}`} />
            </div>
          )}
        </div>

        <aside className="detalhe__resumo">
          <p className="card__tipo">
            {[imovel.tipoImovel?.nome, rotuloFinalidade(imovel.finalidade)].filter(Boolean).join(' • ')}
          </p>
          <h1 className="detalhe__titulo">{imovel.titulo || `Imóvel nº ${imovel.id}`}</h1>
          <p className="card__local">
            {[imovel.bairro?.nome, imovel.bairro?.cidade, imovel.bairro?.estado].filter(Boolean).join(', ')}
          </p>
          <p className="detalhe__preco">
            {formatarPreco(valor)}
            {imovel.finalidade !== 'VENDA' && valor !== null && <small> /mês</small>}
          </p>
          <p>
            <span className={`status status--${(imovel.status || '').toLowerCase()}`}>{rotuloStatus(imovel.status)}</span>
            <span className="card__codigo"> Cód. {imovel.id}</span>
          </p>
          <a className="botao botao--destaque botao--bloco" href={linkContato}>
            Entrar em contato
          </a>
          {!disponivel && (
            <p className="card__codigo">Este imóvel não está disponível para novas ofertas.</p>
          )}
          <AcoesCliente imovel={imovel} />
        </aside>
      </div>

      {imovel.descricao && (
        <section className="detalhe__bloco">
          <h2>Descrição</h2>
          <p>{imovel.descricao}</p>
        </section>
      )}

      <section className="detalhe__bloco">
        <h2>Características</h2>
        <dl className="dados">
          <Dado rotulo="Tipo" valor={imovel.tipoImovel?.nome} />
          <Dado rotulo="Finalidade" valor={rotuloFinalidade(imovel.finalidade)} />
          <Dado rotulo="Dormitórios" valor={imovel.dormitorios} />
          <Dado rotulo="Banheiros" valor={imovel.banheiros} />
          <Dado rotulo="Vagas de garagem" valor={imovel.garagem} />
          <Dado rotulo="Área total" valor={area(imovel.areaTotal)} />
          <Dado rotulo="Área construída" valor={area(imovel.areaConstruida)} />
          <Dado rotulo="Endereço" valor={enderecoCompleto} />
          <Dado rotulo="Bairro" valor={imovel.bairro?.nome} />
          <Dado rotulo="Cidade" valor={imovel.bairro?.cidade} />
          <Dado rotulo="CEP" valor={imovel.cep} />
        </dl>
        {imovel.caracteristicas && <p>{imovel.caracteristicas}</p>}
      </section>
    </section>
  )
}

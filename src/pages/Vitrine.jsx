import { useCallback, useMemo } from 'react'
import ImovelCard from '../components/ImovelCard'
import Filtros from '../components/Filtros'
import Paginacao from '../components/Paginacao'
import { Carregando, MensagemErro } from '../components/Feedback'
import { useCarregar } from '../hooks/useCarregar'
import { useVitrine } from '../hooks/useVitrine'
import { listarBairros, listarImoveis } from '../services/imoveisService'
import { estaDisponivel } from '../utils/imoveis'

const SEM_IMOVEIS = []

export default function Vitrine() {
  const imoveisReq = useCarregar(listarImoveis)
  // Se os bairros falharem, a vitrine continua funcionando (só o select fica vazio).
  const buscarBairros = useCallback(() => listarBairros().catch(() => []), [])
  const bairrosReq = useCarregar(buscarBairros)

  const disponiveis = useMemo(
    () => (imoveisReq.dados ? imoveisReq.dados.filter(estaDisponivel) : SEM_IMOVEIS),
    [imoveisReq.dados],
  )
  const { params, resultado, atualizar, irParaPagina, limpar, temFiltro } = useVitrine(disponiveis)

  const mudarPagina = (pagina) => {
    irParaPagina(pagina)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const { carregando, erro, recarregar } = imoveisReq

  return (
    <>
      <div className="hero">
        <div className="container">
          <h1>Encontre o imóvel ideal para você</h1>
          <p>Casas, apartamentos, terrenos e salas comerciais para comprar ou alugar em Santa Maria.</p>
        </div>
      </div>
    <section className="container vitrine">
      <Filtros
        params={params}
        bairros={bairrosReq.dados || []}
        onAlterar={atualizar}
        onLimpar={limpar}
        temFiltro={temFiltro}
      />

      {carregando && <Carregando texto="Carregando imóveis..." />}
      {!carregando && erro && <MensagemErro texto={erro.mensagem} onTentarNovamente={recarregar} />}

      {!carregando && !erro && resultado.total === 0 && (
        <div className="feedback">
          <p>
            {temFiltro
              ? 'Nenhum imóvel encontrado com esses filtros. Tente ampliar a busca ou limpar os filtros.'
              : 'Nenhum imóvel disponível no momento.'}
          </p>
          {temFiltro && (
            <button type="button" className="botao" onClick={limpar}>
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {!carregando && !erro && resultado.total > 0 && (
        <>
          <p className="contagem" role="status">
            {resultado.total} {resultado.total === 1 ? 'imóvel encontrado' : 'imóveis encontrados'} — página{' '}
            {resultado.pagina} de {resultado.totalPaginas}
          </p>
          <div className="grade">
            {resultado.itens.map((imovel) => (
              <ImovelCard key={imovel.id} imovel={imovel} />
            ))}
          </div>
          <Paginacao pagina={resultado.pagina} totalPaginas={resultado.totalPaginas} onMudar={mudarPagina} />
        </>
      )}
    </section>
    </>
  )
}


import { formatarPreco } from '../utils/formatar'

// Campos como tipo, bairro, cidade, finalidade e foto ainda não existem no backend;
// o card já está preparado para exibi-los assim que forem adicionados.
export default function ImovelCard({ imovel }) {
  const foto = imovel.fotoCapa || imovel.fotos?.[0]?.caminho
  const local = [imovel.bairro?.nome, imovel.cidade || imovel.bairro?.cidade].filter(Boolean).join(', ')
  const finalidade = imovel.finalidade === 'VENDA' ? 'Venda' : 'Aluguel'

  return (
    <article className="card">
      <div className="card__foto">
        {foto ? <img src={foto} alt={imovel.titulo || 'Foto do imóvel'} /> : <span>Sem foto</span>}
        <span className="card__selo">{finalidade}</span>
      </div>
      <div className="card__corpo">
        {imovel.tipo?.nome && <p className="card__tipo">{imovel.tipo.nome}</p>}
        <h2 className="card__titulo">{imovel.titulo || `Imóvel nº ${imovel.id}`}</h2>
        {local && <p className="card__local">{local}</p>}
        {imovel.descricao && <p className="card__descricao">{imovel.descricao}</p>}
        <p className="card__preco">{formatarPreco(imovel.precoAluguel)}</p>
        <p className="card__codigo">Cód. {imovel.id}</p>
      </div>
    </article>
  )
}

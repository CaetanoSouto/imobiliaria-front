import { Link } from 'react-router-dom'
import { formatarPreco } from '../utils/formatar'
import { fotoCapa, rotuloFinalidade, valorImovel } from '../utils/imoveis'
import FotoComFallback from './FotoComFallback'

export default function ImovelCard({ imovel }) {
  const local = [imovel.bairro?.nome, imovel.bairro?.cidade].filter(Boolean).join(', ')
  const meta = [
    imovel.dormitorios ? `${imovel.dormitorios} dorm.` : null,
    imovel.banheiros ? `${imovel.banheiros} banh.` : null,
    imovel.garagem ? `${imovel.garagem} vaga${imovel.garagem > 1 ? 's' : ''}` : null,
    imovel.areaTotal ? `${Number(imovel.areaTotal)} m²` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link to={`/imoveis/${imovel.id}`} className="card" aria-label={imovel.titulo || `Imóvel ${imovel.id}`}>
      <div className="card__foto">
        <FotoComFallback src={fotoCapa(imovel)} alt={imovel.titulo || 'Foto do imóvel'} />
        <span className={`card__selo${imovel.finalidade === 'VENDA' ? ' card__selo--venda' : ''}`}>
          {rotuloFinalidade(imovel.finalidade)}
        </span>
      </div>
      <div className="card__corpo">
        {imovel.tipoImovel?.nome && <p className="card__tipo">{imovel.tipoImovel.nome}</p>}
        <h2 className="card__titulo">{imovel.titulo || `Imóvel nº ${imovel.id}`}</h2>
        {local && <p className="card__local">{local}</p>}
        {meta && <p className="card__meta">{meta}</p>}
        <p className="card__preco">
          {formatarPreco(valorImovel(imovel))}
          {imovel.finalidade !== 'VENDA' && valorImovel(imovel) !== null && <small> /mês</small>}
        </p>
        <p className="card__codigo">Cód. {imovel.id}</p>
      </div>
    </Link>
  )
}

import { useState } from 'react'
import FotoComFallback from './FotoComFallback'

// Foto grande + miniaturas clicáveis.
export default function Galeria({ fotos, titulo }) {
  const [indice, setIndice] = useState(0)
  const atual = fotos[Math.min(indice, fotos.length - 1)]

  return (
    <div className="galeria">
      <div className="galeria__principal">
        <FotoComFallback key={atual?.url} src={atual?.url} alt={titulo} />
      </div>
      {fotos.length > 1 && (
        <ul className="galeria__miniaturas">
          {fotos.map((foto, i) => (
            <li key={foto.id ?? foto.url}>
              <button
                type="button"
                className={i === indice ? 'ativa' : ''}
                onClick={() => setIndice(i)}
                aria-label={`Ver foto ${i + 1} de ${fotos.length}`}
              >
                <FotoComFallback src={foto.url} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

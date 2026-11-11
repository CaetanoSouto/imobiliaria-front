import { useState } from 'react'

// Imagem genérica de imóvel, usada quando não há foto ou a foto não carrega.
export const FOTO_GENERICA = '/sem-foto.svg'

export default function FotoComFallback({ src, alt }) {
  const [falhou, setFalhou] = useState(false)
  const usarGenerica = !src || falhou
  return (
    <img
      src={usarGenerica ? FOTO_GENERICA : src}
      alt={usarGenerica ? `${alt || 'Imóvel'} (foto ilustrativa)` : alt}
      loading="lazy"
      onError={() => setFalhou(true)}
    />
  )
}

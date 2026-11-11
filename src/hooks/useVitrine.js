import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { consultarImoveis, lerParametros } from '../utils/imoveis'

// Estado da vitrine (filtros, ordem e página) guardado na URL, mais o resultado já consultado.
// Alterar qualquer filtro ou a ordem volta para a página 1.
export function useVitrine(imoveis) {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(() => lerParametros(searchParams), [searchParams])

  const resultado = useMemo(() => consultarImoveis(imoveis, params), [imoveis, params])

  const atualizar = useCallback(
    (mudancas, { manterPagina = false } = {}) => {
      const proximo = new URLSearchParams(searchParams)
      Object.entries(mudancas).forEach(([chave, valor]) => {
        if (valor === '' || valor === null || valor === undefined) proximo.delete(chave)
        else proximo.set(chave, String(valor))
      })
      if (!manterPagina) proximo.delete('pagina')
      setSearchParams(proximo)
    },
    [searchParams, setSearchParams],
  )

  const irParaPagina = useCallback(
    (pagina) => atualizar({ pagina: pagina > 1 ? pagina : '' }, { manterPagina: true }),
    [atualizar],
  )

  const limpar = useCallback(() => setSearchParams(new URLSearchParams()), [setSearchParams])

  const temFiltro = Boolean(params.bairro || params.finalidade || params.min || params.max)

  return { params, resultado, atualizar, irParaPagina, limpar, temFiltro }
}

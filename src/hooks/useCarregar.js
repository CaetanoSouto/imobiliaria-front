import { useCallback, useEffect, useState } from 'react'
import { mensagemErro } from '../utils/erros'

// Busca dados e controla carregando/erro. `recarregar` serve para o botão "Tentar novamente".
export function useCarregar(buscar, deps = []) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro(null)
    buscar()
      .then((resultado) => ativo && setDados(resultado))
      .catch((e) => ativo && setErro({ mensagem: mensagemErro(e), status: e.response?.status }))
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tentativa])

  const recarregar = useCallback(() => setTentativa((t) => t + 1), [])
  return { dados, carregando, erro, recarregar }
}

import { useCallback, useEffect, useState } from 'react'
import ImovelCard from '../components/ImovelCard'
import { Carregando, MensagemErro, SemResultados } from '../components/Feedback'
import { listarImoveis } from '../services/imoveisService'
import { mensagemErro } from '../utils/erros'

// Imóveis sem status (ex.: inseridos pelo data.sql) são tratados como disponíveis.
const estaDisponivel = (imovel) => !imovel.status || imovel.status === 'DISPONIVEL'

export default function Vitrine() {
  const [imoveis, setImoveis] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const buscar = useCallback(async () => {
    try {
      const lista = await listarImoveis()
      setImoveis(lista.filter(estaDisponivel))
      setErro(null)
    } catch (e) {
      setErro(mensagemErro(e))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    buscar()
  }, [buscar])

  const carregar = () => {
    setCarregando(true)
    setErro(null)
    buscar()
  }

  return (
    <section className="container">
      <h1 className="pagina__titulo">Imóveis disponíveis</h1>

      {carregando && <Carregando texto="Carregando imóveis..." />}
      {!carregando && erro && <MensagemErro texto={erro} onTentarNovamente={carregar} />}
      {!carregando && !erro && imoveis.length === 0 && (
        <SemResultados texto="Nenhum imóvel disponível no momento." />
      )}
      {!carregando && !erro && imoveis.length > 0 && (
        <div className="grade">
          {imoveis.map((imovel) => (
            <ImovelCard key={imovel.id} imovel={imovel} />
          ))}
        </div>
      )}
    </section>
  )
}

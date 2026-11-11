import { useState } from 'react'
import { Link } from 'react-router-dom'
import ImovelCard from '../../components/ImovelCard'
import { Carregando, MensagemErro } from '../../components/Feedback'
import { useCarregar } from '../../hooks/useCarregar'
import { listarFavoritos, removerFavorito } from '../../services/clienteService'
import { mensagemErro } from '../../utils/erros'

export default function Favoritos() {
  const { dados, carregando, erro, recarregar } = useCarregar(listarFavoritos)
  const [removendo, setRemovendo] = useState(null)
  const [erroRemover, setErroRemover] = useState(null)

  const remover = async (imovelId) => {
    setRemovendo(imovelId)
    setErroRemover(null)
    try {
      await removerFavorito(imovelId)
      recarregar()
    } catch (e) {
      setErroRemover(mensagemErro(e))
    } finally {
      setRemovendo(null)
    }
  }

  return (
    <section className="container">
      <h1 className="pagina__titulo">Meus favoritos</h1>

      {erroRemover && (
        <p className="aviso aviso--erro" role="alert">
          {erroRemover}
        </p>
      )}

      {carregando && <Carregando texto="Carregando favoritos..." />}
      {!carregando && erro && <MensagemErro texto={erro.mensagem} onTentarNovamente={recarregar} />}
      {!carregando && !erro && dados?.length === 0 && (
        <div className="feedback">
          <p>Você ainda não favoritou nenhum imóvel.</p>
          <Link to="/" className="botao">
            Ver imóveis
          </Link>
        </div>
      )}

      {!carregando && !erro && dados?.length > 0 && (
        <div className="grade">
          {dados.map((f) => (
            <div key={f.id} className="favorito">
              <ImovelCard imovel={f.imovel} />
              {f.imovel.status !== 'DISPONIVEL' && <p className="favorito__aviso">Imóvel indisponível no momento</p>}
              <button
                type="button"
                className="botao botao--perigo-contorno botao--bloco"
                onClick={() => remover(f.imovel.id)}
                disabled={removendo === f.imovel.id}
              >
                {removendo === f.imovel.id ? 'Removendo...' : 'Remover dos favoritos'}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

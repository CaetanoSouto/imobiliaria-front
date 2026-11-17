import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ConfirmarExclusao from '../../components/ConfirmarExclusao'
import { Carregando, MensagemErro, SemResultados } from '../../components/Feedback'
import FotoComFallback from '../../components/FotoComFallback'
import { useCarregar } from '../../hooks/useCarregar'
import { atualizarFoto, enviarFoto, excluirFoto } from '../../services/fotosService'
import { buscarImovel, listarImoveis } from '../../services/imoveisService'
import { mensagemErro } from '../../utils/erros'
import { urlFoto } from '../../utils/imoveis'

const TAMANHO_MAXIMO = 10 * 1024 * 1024 // 10 MB, o mesmo limite do backend

// Um cartão por foto: miniatura, capa, posição (ordem) e exclusão.
function CartaoFoto({ foto, ocupado, onCapa, onOrdem, onExcluir }) {
  const [ordem, setOrdem] = useState(String(foto.ordem ?? 0))
  const ordemValida = /^\d+$/.test(ordem)
  const mudou = ordemValida && Number(ordem) !== (foto.ordem ?? 0)

  return (
    <li className="foto-admin">
      <div className="foto-admin__imagem">
        <FotoComFallback src={urlFoto(foto.url || foto.caminho)} alt={foto.nomeArquivo || 'Foto do imóvel'} />
        {foto.capa && <span className="foto-admin__capa">Capa</span>}
      </div>
      <div className="foto-admin__acoes">
        <label className="campo foto-admin__ordem">
          <span>Posição</span>
          <input
            inputMode="numeric"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value)}
            aria-invalid={!ordemValida}
          />
        </label>
        <button
          type="button"
          className="botao botao--secundario botao--pequeno"
          disabled={ocupado || !mudou}
          onClick={() => onOrdem(foto, Number(ordem))}
        >
          Salvar posição
        </button>
        {!foto.capa && (
          <button type="button" className="botao botao--secundario botao--pequeno" disabled={ocupado} onClick={() => onCapa(foto)}>
            Tornar capa
          </button>
        )}
        <button
          type="button"
          className="botao botao--perigo-contorno botao--pequeno"
          disabled={ocupado}
          onClick={() => onExcluir(foto)}
        >
          Excluir
        </button>
      </div>
    </li>
  )
}

// Tudo o que é de um imóvel: enviar, definir capa/posição e excluir fotos. A página usa
// `key={imovelId}`, então trocar de imóvel começa este painel do zero (sem mensagens antigas).
function FotosDoImovel({ imovelId }) {
  const imovel = useCarregar(() => buscarImovel(imovelId), [imovelId])

  const [arquivo, setArquivo] = useState(null)
  const [erroArquivo, setErroArquivo] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [sucesso, setSucesso] = useState(null)
  const [erroAcao, setErroAcao] = useState(null)
  const [excluir, setExcluir] = useState(null)
  const [erroExcluir, setErroExcluir] = useState(null)
  const [excluindo, setExcluindo] = useState(false)
  const campoArquivo = useRef(null)

  const limparArquivo = () => {
    setArquivo(null)
    if (campoArquivo.current) campoArquivo.current.value = ''
  }

  const escolherArquivo = (e) => {
    const escolhido = e.target.files?.[0] || null
    setSucesso(null)
    setArquivo(null)
    if (!escolhido) {
      setErroArquivo(null)
      return
    }
    if (!escolhido.type.startsWith('image/')) setErroArquivo('O arquivo precisa ser uma imagem (JPG, PNG, WEBP...).')
    else if (escolhido.size > TAMANHO_MAXIMO) setErroArquivo('A foto é grande demais. O tamanho máximo é 10 MB.')
    else {
      setErroArquivo(null)
      setArquivo(escolhido)
    }
  }

  const enviar = async (e) => {
    e.preventDefault()
    setSucesso(null)
    setErroAcao(null)
    if (!arquivo) {
      setErroArquivo(erroArquivo || 'Escolha uma foto para enviar.')
      return
    }
    setEnviando(true)
    try {
      await enviarFoto(imovelId, arquivo)
      setSucesso('Foto adicionada com sucesso.')
      limparArquivo()
      imovel.recarregar()
    } catch (err) {
      setErroAcao(mensagemErro(err))
    } finally {
      setEnviando(false)
    }
  }

  const alterar = async (foto, mudancas, mensagem) => {
    setOcupado(true)
    setSucesso(null)
    setErroAcao(null)
    try {
      await atualizarFoto(foto.id, mudancas)
      setSucesso(mensagem)
      imovel.recarregar()
    } catch (err) {
      setErroAcao(mensagemErro(err))
    } finally {
      setOcupado(false)
    }
  }

  const confirmarExclusao = async () => {
    setExcluindo(true)
    setErroExcluir(null)
    try {
      await excluirFoto(excluir.id)
      setSucesso('Foto excluída com sucesso.')
      setExcluir(null)
      imovel.recarregar()
    } catch (err) {
      setErroExcluir(mensagemErro(err))
    } finally {
      setExcluindo(false)
    }
  }

  if (imovel.carregando) return <Carregando texto="Carregando fotos..." />
  if (imovel.erro) return <MensagemErro texto={imovel.erro.mensagem} onTentarNovamente={imovel.recarregar} />
  if (!imovel.dados) return null

  const fotos = [...(imovel.dados.fotos || [])].sort(
    (a, b) => Number(Boolean(b.capa)) - Number(Boolean(a.capa)) || (a.ordem ?? 0) - (b.ordem ?? 0),
  )

  return (
    <>
      <form className="formulario formulario--largo" onSubmit={enviar} noValidate>
        <h2 className="formulario__titulo">Adicionar foto a &quot;{imovel.dados.titulo}&quot;</h2>
        {sucesso && (
          <p className="aviso aviso--sucesso" role="status">
            {sucesso}
          </p>
        )}
        {erroAcao && (
          <p className="aviso aviso--erro" role="alert">
            {erroAcao}
          </p>
        )}
        <label className="campo">
          <span>Arquivo de imagem</span>
          <input
            ref={campoArquivo}
            type="file"
            accept="image/*"
            onChange={escolherArquivo}
            aria-invalid={Boolean(erroArquivo)}
          />
          {erroArquivo && <small className="campo__erro">{erroArquivo}</small>}
          {!erroArquivo && <small className="campo__dica">JPG, PNG ou WEBP, até 10 MB. A primeira foto vira a capa.</small>}
        </label>
        <div className="formulario__acoes">
          <button type="submit" className="botao" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar foto'}
          </button>
        </div>
      </form>

      <h2 className="secao__titulo">Fotos cadastradas</h2>
      {fotos.length === 0 ? (
        <SemResultados texto="Este imóvel ainda não tem fotos." />
      ) : (
        <ul className="fotos-admin">
          {fotos.map((f) => (
            <CartaoFoto
              key={`${f.id}-${f.ordem}-${f.capa}`}
              foto={f}
              ocupado={ocupado}
              onCapa={(foto) => alterar(foto, { capa: true }, 'Capa atualizada.')}
              onOrdem={(foto, ordem) => alterar(foto, { ordem }, 'Posição atualizada.')}
              onExcluir={(foto) => {
                setSucesso(null)
                setExcluir(foto)
              }}
            />
          ))}
        </ul>
      )}

      {excluir && (
        <ConfirmarExclusao
          titulo="Excluir foto?"
          texto="Tem certeza que deseja excluir esta foto? Essa ação não pode ser desfeita."
          erro={erroExcluir}
          excluindo={excluindo}
          onConfirmar={confirmarExclusao}
          onCancelar={() => {
            setExcluir(null)
            setErroExcluir(null)
          }}
        />
      )}
    </>
  )
}

export default function Fotos() {
  const [params, setParams] = useSearchParams()
  const imovelId = params.get('imovel') || ''
  const lista = useCarregar(listarImoveis)

  return (
    <section className="container">
      <h1 className="pagina__titulo">Fotos dos imóveis</h1>

      {lista.carregando && <Carregando texto="Carregando imóveis..." />}
      {!lista.carregando && lista.erro && <MensagemErro texto={lista.erro.mensagem} onTentarNovamente={lista.recarregar} />}

      {!lista.carregando && !lista.erro && (
        <div className="filtros filtros--simples">
          <label className="campo">
            <span>Imóvel</span>
            <select value={imovelId} onChange={(e) => setParams(e.target.value ? { imovel: e.target.value } : {})}>
              <option value="">Escolha um imóvel...</option>
              {lista.dados.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.titulo}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {!imovelId && !lista.carregando && !lista.erro && (
        <SemResultados texto="Escolha um imóvel para ver e gerenciar as fotos dele." />
      )}

      {imovelId && <FotosDoImovel key={imovelId} imovelId={imovelId} />}
    </section>
  )
}

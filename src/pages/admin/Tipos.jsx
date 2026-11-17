import { useState } from 'react'
import ConfirmarExclusao from '../../components/ConfirmarExclusao'
import { Carregando, MensagemErro, SemResultados } from '../../components/Feedback'
import { useCarregar } from '../../hooks/useCarregar'
import { atualizarTipo, criarTipo, excluirTipo, listarTipos } from '../../services/tiposService'
import { mensagemErro } from '../../utils/erros'

const VAZIO = { nome: '', descricao: '' }

function validar(campos) {
  const erros = {}
  if (!campos.nome.trim()) erros.nome = 'Informe o nome do tipo.'
  return erros
}

export default function Tipos() {
  const { dados, carregando, erro, recarregar } = useCarregar(listarTipos)
  const [editandoId, setEditandoId] = useState(null) // null = cadastrando
  const [campos, setCampos] = useState(VAZIO)
  const [erros, setErros] = useState({})
  const [erroForm, setErroForm] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(null)
  const [excluir, setExcluir] = useState(null)
  const [erroExcluir, setErroExcluir] = useState(null)
  const [excluindo, setExcluindo] = useState(false)

  const alterar = (e) => setCampos((c) => ({ ...c, [e.target.name]: e.target.value }))

  const limparFormulario = () => {
    setEditandoId(null)
    setCampos(VAZIO)
    setErros({})
    setErroForm(null)
  }

  const comecarEdicao = (tipo) => {
    setEditandoId(tipo.id)
    setCampos({ nome: tipo.nome ?? '', descricao: tipo.descricao ?? '' })
    setErros({})
    setErroForm(null)
    setSucesso(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const salvar = async (e) => {
    e.preventDefault()
    const encontrados = validar(campos)
    setErros(encontrados)
    setErroForm(null)
    setSucesso(null)
    if (Object.keys(encontrados).length > 0) return

    const corpo = { nome: campos.nome.trim(), descricao: campos.descricao.trim() || null }
    setSalvando(true)
    try {
      if (editandoId === null) await criarTipo(corpo)
      else await atualizarTipo(editandoId, corpo)
      setSucesso(editandoId === null ? 'Tipo cadastrado com sucesso.' : 'Tipo atualizado com sucesso.')
      limparFormulario()
      recarregar()
    } catch (err) {
      setErroForm(mensagemErro(err))
    } finally {
      setSalvando(false)
    }
  }

  const confirmarExclusao = async () => {
    setExcluindo(true)
    setErroExcluir(null)
    try {
      await excluirTipo(excluir.id)
      if (editandoId === excluir.id) limparFormulario()
      setSucesso('Tipo excluído com sucesso.')
      setExcluir(null)
      recarregar()
    } catch (err) {
      // 409: o tipo ainda é usado por imóveis
      setErroExcluir(mensagemErro(err))
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <section className="container">
      <h1 className="pagina__titulo">Tipos de imóveis</h1>

      <form className="formulario formulario--largo" onSubmit={salvar} noValidate>
        <h2 className="formulario__titulo">{editandoId === null ? 'Novo tipo' : 'Editar tipo'}</h2>

        {sucesso && (
          <p className="aviso aviso--sucesso" role="status">
            {sucesso}
          </p>
        )}
        {erroForm && (
          <p className="aviso aviso--erro" role="alert">
            {erroForm}
          </p>
        )}

        <div className="formulario__grade formulario__grade--auto">
          <label className="campo">
            <span>Nome</span>
            <input
              name="nome"
              value={campos.nome}
              onChange={alterar}
              placeholder="Casa, Apartamento..."
              aria-invalid={Boolean(erros.nome)}
            />
            {erros.nome && <small className="campo__erro">{erros.nome}</small>}
          </label>
          <label className="campo">
            <span>Descrição (opcional)</span>
            <input name="descricao" value={campos.descricao} onChange={alterar} />
          </label>
        </div>

        <div className="formulario__acoes">
          <button type="submit" className="botao" disabled={salvando}>
            {salvando ? 'Salvando...' : editandoId === null ? 'Cadastrar' : 'Salvar alterações'}
          </button>
          {editandoId !== null && (
            <button type="button" className="botao botao--secundario" onClick={limparFormulario}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <h2 className="secao__titulo">Tipos cadastrados</h2>

      {carregando && <Carregando texto="Carregando tipos..." />}
      {!carregando && erro && <MensagemErro texto={erro.mensagem} onTentarNovamente={recarregar} />}
      {!carregando && !erro && dados?.length === 0 && <SemResultados texto="Nenhum tipo cadastrado ainda." />}

      {!carregando && !erro && dados?.length > 0 && (
        <div className="tabela__rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {dados.map((t) => (
                <tr key={t.id}>
                  <td data-rotulo="Nome">{t.nome}</td>
                  <td data-rotulo="Descrição">{t.descricao || '—'}</td>
                  <td className="tabela__acoes">
                    <button type="button" className="botao botao--secundario botao--pequeno" onClick={() => comecarEdicao(t)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="botao botao--perigo-contorno botao--pequeno"
                      onClick={() => {
                        setSucesso(null)
                        setExcluir(t)
                      }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {excluir && (
        <ConfirmarExclusao
          titulo="Excluir tipo?"
          texto={`Tem certeza que deseja excluir o tipo "${excluir.nome}"? Essa ação não pode ser desfeita.`}
          erro={erroExcluir}
          excluindo={excluindo}
          onConfirmar={confirmarExclusao}
          onCancelar={() => {
            setExcluir(null)
            setErroExcluir(null)
          }}
        />
      )}
    </section>
  )
}

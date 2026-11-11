import { useState } from 'react'
import ConfirmarExclusao from '../../components/ConfirmarExclusao'
import { Carregando, MensagemErro, SemResultados } from '../../components/Feedback'
import { useCarregar } from '../../hooks/useCarregar'
import { atualizarBairro, criarBairro, excluirBairro, listarBairros } from '../../services/bairrosService'
import { mensagemErro } from '../../utils/erros'

const VAZIO = { nome: '', cidade: '', estado: '', cepInicial: '' }

function validar(campos) {
  const erros = {}
  if (!campos.nome.trim()) erros.nome = 'Informe o nome do bairro.'
  if (!campos.cidade.trim()) erros.cidade = 'Informe a cidade.'
  if (!campos.estado.trim()) erros.estado = 'Informe o estado (UF).'
  else if (!/^[A-Za-z]{2}$/.test(campos.estado.trim())) erros.estado = 'Use a sigla com 2 letras, como RS.'
  if (campos.cepInicial.trim() && !/^\d{5,8}$/.test(campos.cepInicial.trim())) {
    erros.cepInicial = 'Use somente números (5 a 8 dígitos).'
  }
  return erros
}

export default function Bairros() {
  const { dados, carregando, erro, recarregar } = useCarregar(listarBairros)
  const [editandoId, setEditandoId] = useState(null) // null = cadastrando
  const [campos, setCampos] = useState(VAZIO)
  const [erros, setErros] = useState({})
  const [erroForm, setErroForm] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(null)
  const [excluir, setExcluir] = useState(null) // bairro a confirmar
  const [erroExcluir, setErroExcluir] = useState(null)
  const [excluindo, setExcluindo] = useState(false)

  const alterar = (e) => setCampos((c) => ({ ...c, [e.target.name]: e.target.value }))

  const limparFormulario = () => {
    setEditandoId(null)
    setCampos(VAZIO)
    setErros({})
    setErroForm(null)
  }

  const comecarEdicao = (bairro) => {
    setEditandoId(bairro.id)
    setCampos({
      nome: bairro.nome ?? '',
      cidade: bairro.cidade ?? '',
      estado: bairro.estado ?? '',
      cepInicial: bairro.cepInicial ?? '',
    })
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

    const corpo = {
      nome: campos.nome.trim(),
      cidade: campos.cidade.trim(),
      estado: campos.estado.trim().toUpperCase(),
      cepInicial: campos.cepInicial.trim() || null,
    }
    setSalvando(true)
    try {
      if (editandoId === null) await criarBairro(corpo)
      else await atualizarBairro(editandoId, corpo)
      setSucesso(editandoId === null ? 'Bairro cadastrado com sucesso.' : 'Bairro atualizado com sucesso.')
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
      await excluirBairro(excluir.id)
      if (editandoId === excluir.id) limparFormulario()
      setSucesso('Bairro excluído com sucesso.')
      setExcluir(null)
      recarregar()
    } catch (err) {
      // 409 traz a mensagem da regra de negócio (ex.: bairro com imóveis)
      setErroExcluir(mensagemErro(err))
    } finally {
      setExcluindo(false)
    }
  }

  const cancelarExclusao = () => {
    setExcluir(null)
    setErroExcluir(null)
  }

  return (
    <section className="container">
      <h1 className="pagina__titulo">Bairros</h1>

      <form className="formulario formulario--largo" onSubmit={salvar} noValidate>
        <h2 className="formulario__titulo">{editandoId === null ? 'Novo bairro' : 'Editar bairro'}</h2>

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

        <div className="formulario__grade">
          <label className="campo">
            <span>Nome</span>
            <input name="nome" value={campos.nome} onChange={alterar} aria-invalid={Boolean(erros.nome)} />
            {erros.nome && <small className="campo__erro">{erros.nome}</small>}
          </label>
          <label className="campo">
            <span>Cidade</span>
            <input name="cidade" value={campos.cidade} onChange={alterar} aria-invalid={Boolean(erros.cidade)} />
            {erros.cidade && <small className="campo__erro">{erros.cidade}</small>}
          </label>
          <label className="campo">
            <span>Estado (UF)</span>
            <input
              name="estado"
              value={campos.estado}
              onChange={alterar}
              maxLength={2}
              placeholder="RS"
              aria-invalid={Boolean(erros.estado)}
            />
            {erros.estado && <small className="campo__erro">{erros.estado}</small>}
          </label>
          <label className="campo">
            <span>CEP inicial (opcional)</span>
            <input
              name="cepInicial"
              value={campos.cepInicial}
              onChange={alterar}
              inputMode="numeric"
              placeholder="97010"
              aria-invalid={Boolean(erros.cepInicial)}
            />
            {erros.cepInicial && <small className="campo__erro">{erros.cepInicial}</small>}
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

      <h2 className="secao__titulo">Bairros cadastrados</h2>

      {carregando && <Carregando texto="Carregando bairros..." />}
      {!carregando && erro && <MensagemErro texto={erro.mensagem} onTentarNovamente={recarregar} />}
      {!carregando && !erro && dados?.length === 0 && <SemResultados texto="Nenhum bairro cadastrado ainda." />}

      {!carregando && !erro && dados?.length > 0 && (
        <div className="tabela__rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cidade</th>
                <th>UF</th>
                <th>CEP inicial</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {dados.map((b) => (
                <tr key={b.id}>
                  <td data-rotulo="Nome">{b.nome}</td>
                  <td data-rotulo="Cidade">{b.cidade}</td>
                  <td data-rotulo="UF">{b.estado}</td>
                  <td data-rotulo="CEP inicial">{b.cepInicial || '—'}</td>
                  <td className="tabela__acoes">
                    <button type="button" className="botao botao--secundario botao--pequeno" onClick={() => comecarEdicao(b)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="botao botao--perigo-contorno botao--pequeno"
                      onClick={() => {
                        setSucesso(null)
                        setExcluir(b)
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
          titulo="Excluir bairro?"
          texto={`Tem certeza que deseja excluir o bairro "${excluir.nome}"? Essa ação não pode ser desfeita.`}
          erro={erroExcluir}
          excluindo={excluindo}
          onConfirmar={confirmarExclusao}
          onCancelar={cancelarExclusao}
        />
      )}
    </section>
  )
}

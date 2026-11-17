import { useEffect, useState } from 'react'
import ConfirmarExclusao from '../../components/ConfirmarExclusao'
import { Carregando, MensagemErro, SemResultados } from '../../components/Feedback'
import { useAuth } from '../../context/AuthContext'
import { useCarregar } from '../../hooks/useCarregar'
import {
  atualizarUsuario,
  criarUsuario,
  excluirUsuario,
  listarUsuarios,
} from '../../services/usuariosService'
import { mensagemErro } from '../../utils/erros'
import { PERFIS, rotuloPerfil } from '../../utils/perfil'
import { EMAIL_VALIDO } from '../../utils/validacao'

const VAZIO = { nome: '', email: '', senha: '', tipo: 'USER' }
const SENHA_MINIMA = 3

function validar(campos, editando) {
  const erros = {}
  if (!campos.nome.trim()) erros.nome = 'Informe o nome.'
  if (!campos.email.trim()) erros.email = 'Informe o e-mail.'
  else if (!EMAIL_VALIDO.test(campos.email.trim())) erros.email = 'Informe um e-mail válido, como nome@dominio.com.'
  if (!editando && !campos.senha) erros.senha = 'Informe a senha.'
  else if (campos.senha && campos.senha.length < SENHA_MINIMA) {
    erros.senha = `A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`
  }
  return erros
}

export default function Usuarios() {
  const { usuario: logado } = useAuth()

  // A busca só vai ao backend 300 ms depois de parar de digitar.
  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')
  useEffect(() => {
    const id = setTimeout(() => setBuscaAplicada(busca.trim()), 300)
    return () => clearTimeout(id)
  }, [busca])

  const { dados, carregando, erro, recarregar } = useCarregar(() => listarUsuarios(buscaAplicada), [buscaAplicada])

  const [editandoId, setEditandoId] = useState(null)
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

  const comecarEdicao = (u) => {
    setEditandoId(u.id)
    setCampos({ nome: u.nome ?? '', email: u.email ?? '', senha: '', tipo: u.tipo ?? 'USER' })
    setErros({})
    setErroForm(null)
    setSucesso(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const salvar = async (e) => {
    e.preventDefault()
    const encontrados = validar(campos, editandoId !== null)
    setErros(encontrados)
    setErroForm(null)
    setSucesso(null)
    if (Object.keys(encontrados).length > 0) return

    const corpo = {
      nome: campos.nome.trim(),
      email: campos.email.trim(),
      tipo: campos.tipo,
      // na edição, senha em branco = manter a atual
      senha: campos.senha || undefined,
    }
    setSalvando(true)
    try {
      if (editandoId === null) await criarUsuario(corpo)
      else await atualizarUsuario(editandoId, corpo)
      setSucesso(editandoId === null ? 'Usuário cadastrado com sucesso.' : 'Usuário atualizado com sucesso.')
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
      await excluirUsuario(excluir.id)
      if (editandoId === excluir.id) limparFormulario()
      setSucesso('Usuário excluído com sucesso.')
      setExcluir(null)
      recarregar()
    } catch (err) {
      // 409 traz a regra de negócio (ex.: usuário com ofertas)
      setErroExcluir(mensagemErro(err))
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <section className="container">
      <h1 className="pagina__titulo">Usuários</h1>

      <form className="formulario formulario--largo" onSubmit={salvar} noValidate>
        <h2 className="formulario__titulo">{editandoId === null ? 'Novo usuário' : 'Editar usuário'}</h2>

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
            <input name="nome" value={campos.nome} onChange={alterar} aria-invalid={Boolean(erros.nome)} />
            {erros.nome && <small className="campo__erro">{erros.nome}</small>}
          </label>
          <label className="campo">
            <span>E-mail</span>
            <input
              name="email"
              type="email"
              value={campos.email}
              onChange={alterar}
              autoComplete="off"
              aria-invalid={Boolean(erros.email)}
            />
            {erros.email && <small className="campo__erro">{erros.email}</small>}
          </label>
          <label className="campo">
            <span>{editandoId === null ? 'Senha' : 'Nova senha (opcional)'}</span>
            <input
              name="senha"
              type="password"
              value={campos.senha}
              onChange={alterar}
              autoComplete="new-password"
              aria-invalid={Boolean(erros.senha)}
            />
            {erros.senha && <small className="campo__erro">{erros.senha}</small>}
            {editandoId !== null && !erros.senha && (
              <small className="campo__dica">Deixe em branco para manter a senha atual.</small>
            )}
          </label>
          <label className="campo">
            <span>Perfil</span>
            <select name="tipo" value={campos.tipo} onChange={alterar}>
              {PERFIS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.rotulo}
                </option>
              ))}
            </select>
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

      <h2 className="secao__titulo">Usuários cadastrados</h2>

      <div className="filtros filtros--simples">
        <label className="campo">
          <span>Buscar por nome ou e-mail</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Ex.: maria ou @email.com"
          />
        </label>
      </div>

      {carregando && <Carregando texto="Carregando usuários..." />}
      {!carregando && erro && <MensagemErro texto={erro.mensagem} onTentarNovamente={recarregar} />}
      {!carregando && !erro && dados?.length === 0 && (
        <SemResultados texto={buscaAplicada ? 'Nenhum usuário encontrado para essa busca.' : 'Nenhum usuário cadastrado.'} />
      )}

      {!carregando && !erro && dados?.length > 0 && (
        <div className="tabela__rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {dados.map((u) => {
                const ehEu = u.email?.toLowerCase() === logado.email?.toLowerCase()
                return (
                  <tr key={u.id}>
                    <td data-rotulo="Nome">
                      {u.nome} {ehEu && <small className="campo__dica">(você)</small>}
                    </td>
                    <td data-rotulo="E-mail">{u.email}</td>
                    <td data-rotulo="Perfil">
                      <span className={`badge badge--perfil-${(u.tipo || '').toLowerCase()}`}>{rotuloPerfil(u.tipo)}</span>
                    </td>
                    <td className="tabela__acoes">
                      <button type="button" className="botao botao--secundario botao--pequeno" onClick={() => comecarEdicao(u)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="botao botao--perigo-contorno botao--pequeno"
                        disabled={ehEu}
                        title={ehEu ? 'Você não pode excluir o seu próprio usuário.' : undefined}
                        onClick={() => {
                          setSucesso(null)
                          setExcluir(u)
                        }}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {excluir && (
        <ConfirmarExclusao
          titulo="Excluir usuário?"
          texto={`Tem certeza que deseja excluir ${excluir.nome} (${excluir.email})? Essa ação não pode ser desfeita.`}
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

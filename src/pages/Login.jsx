import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mensagemErro } from '../utils/erros'
import { areaInicial } from '../utils/perfil'

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validar({ email, senha }) {
  const erros = {}
  if (!email.trim()) erros.email = 'Informe o e-mail.'
  else if (!EMAIL_VALIDO.test(email.trim())) erros.email = 'Informe um e-mail válido, como nome@dominio.com.'
  if (!senha) erros.senha = 'Informe a senha.'
  return erros
}

export default function Login() {
  const { login, autenticado, usuario, sessaoExpirada } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [campos, setCampos] = useState({ email: '', senha: '' })
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState(null)
  const [enviando, setEnviando] = useState(false)

  // Quem já está logado vai direto para a sua área.
  if (autenticado && !enviando) return <Navigate to={areaInicial(usuario.tipo)} replace />

  const alterar = (e) => setCampos((c) => ({ ...c, [e.target.name]: e.target.value }))

  const enviar = async (e) => {
    e.preventDefault()
    const encontrados = validar(campos)
    setErros(encontrados)
    setErroGeral(null)
    if (Object.keys(encontrados).length > 0) return

    setEnviando(true)
    try {
      const logado = await login(campos.email.trim(), campos.senha)
      navigate(areaInicial(logado.tipo), { replace: true })
    } catch (erro) {
      // No login, 401 significa credencial errada (não "sessão expirada").
      setErroGeral(erro.response?.status === 401 ? 'E-mail ou senha incorretos.' : mensagemErro(erro))
      setEnviando(false)
    }
  }

  const avisoExpirada = sessaoExpirada || params.get('expirada') === '1'

  return (
    <section className="container login">
      <form className="formulario" onSubmit={enviar} noValidate>
        <h1 className="pagina__titulo">Entrar</h1>

        {avisoExpirada && !erroGeral && (
          <p className="aviso" role="status">
            Sua sessão expirou. Faça login novamente.
          </p>
        )}
        {erroGeral && (
          <p className="aviso aviso--erro" role="alert">
            {erroGeral}
          </p>
        )}

        <label className="campo">
          <span>E-mail</span>
          <input
            type="email"
            name="email"
            value={campos.email}
            onChange={alterar}
            autoComplete="username"
            aria-invalid={Boolean(erros.email)}
          />
          {erros.email && <small className="campo__erro">{erros.email}</small>}
        </label>

        <label className="campo">
          <span>Senha</span>
          <input
            type="password"
            name="senha"
            value={campos.senha}
            onChange={alterar}
            autoComplete="current-password"
            aria-invalid={Boolean(erros.senha)}
          />
          {erros.senha && <small className="campo__erro">{erros.senha}</small>}
        </label>

        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}

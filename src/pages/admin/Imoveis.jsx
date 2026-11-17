import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmarExclusao from '../../components/ConfirmarExclusao'
import { Carregando, MensagemErro, SemResultados } from '../../components/Feedback'
import { useCarregar } from '../../hooks/useCarregar'
import { atualizarImovel, criarImovel, excluirImovel } from '../../services/imoveisAdminService'
import { listarBairros, listarImoveis } from '../../services/imoveisService'
import { listarTipos } from '../../services/tiposService'
import { mensagemErro } from '../../utils/erros'
import { formatarPreco, rotuloStatus } from '../../utils/formatar'
import { rotuloFinalidade, valorImovel } from '../../utils/imoveis'
import { inteiroValido, lerNumero } from '../../utils/validacao'

const SITUACOES = ['DISPONIVEL', 'RESERVADO', 'ALUGADO', 'VENDIDO', 'INDISPONIVEL']

const VAZIO = {
  titulo: '',
  descricao: '',
  finalidade: 'VENDA',
  status: 'DISPONIVEL',
  tipoId: '',
  bairroId: '',
  preco: '',
  dormitorios: '',
  banheiros: '',
  garagem: '',
  areaTotal: '',
  areaConstruida: '',
  endereco: '',
  numero: '',
  complemento: '',
  cep: '',
  caracteristicas: '',
  destaque: false,
}

function validar(c) {
  const erros = {}
  if (!c.titulo.trim()) erros.titulo = 'Informe o título.'
  if (!c.tipoId) erros.tipoId = 'Escolha o tipo do imóvel.'
  if (!c.bairroId) erros.bairroId = 'Escolha o bairro.'

  const preco = lerNumero(c.preco)
  if (!c.preco.trim()) erros.preco = c.finalidade === 'VENDA' ? 'Informe o preço de venda.' : 'Informe o valor do aluguel.'
  else if (preco === null) erros.preco = 'Digite um número, como 350000 ou 1.500,00.'
  else if (preco <= 0) erros.preco = 'O valor precisa ser maior que zero.'

  ;['dormitorios', 'banheiros', 'garagem'].forEach((campo) => {
    if (!inteiroValido(c[campo])) erros[campo] = 'Use um número inteiro (0 ou mais).'
  })
  ;['areaTotal', 'areaConstruida'].forEach((campo) => {
    if (c[campo].trim()) {
      const area = lerNumero(c[campo])
      if (area === null || area < 0) erros[campo] = 'Digite um número válido (0 ou mais).'
    }
  })
  if (c.cep.trim() && !/^\d{5}-?\d{3}$|^\d{5,8}$/.test(c.cep.trim())) erros.cep = 'Use só números, como 97010-000.'
  return erros
}

const inteiroOuNulo = (texto) => (String(texto).trim() === '' ? null : Number.parseInt(texto, 10))
const numeroOuNulo = (texto) => (String(texto).trim() === '' ? null : lerNumero(texto))

function paraCorpo(c) {
  const preco = lerNumero(c.preco)
  return {
    titulo: c.titulo.trim(),
    descricao: c.descricao.trim() || null,
    finalidade: c.finalidade,
    status: c.status,
    tipoImovel: { id: Number(c.tipoId) },
    bairro: { id: Number(c.bairroId) },
    precoVenda: c.finalidade === 'VENDA' ? preco : null,
    precoAluguel: c.finalidade === 'ALUGUEL' ? preco : null,
    dormitorios: inteiroOuNulo(c.dormitorios),
    banheiros: inteiroOuNulo(c.banheiros),
    garagem: inteiroOuNulo(c.garagem),
    areaTotal: numeroOuNulo(c.areaTotal),
    areaConstruida: numeroOuNulo(c.areaConstruida),
    endereco: c.endereco.trim() || null,
    numero: c.numero.trim() || null,
    complemento: c.complemento.trim() || null,
    cep: c.cep.trim() || null,
    caracteristicas: c.caracteristicas.trim() || null,
    destaque: c.destaque,
  }
}

function deImovel(i) {
  const texto = (v) => (v === null || v === undefined ? '' : String(v))
  return {
    titulo: texto(i.titulo),
    descricao: texto(i.descricao),
    finalidade: i.finalidade || 'VENDA',
    status: i.status || 'DISPONIVEL',
    tipoId: texto(i.tipoImovel?.id),
    bairroId: texto(i.bairro?.id),
    preco: texto(i.finalidade === 'ALUGUEL' ? i.precoAluguel : i.precoVenda),
    dormitorios: texto(i.dormitorios),
    banheiros: texto(i.banheiros),
    garagem: texto(i.garagem),
    areaTotal: texto(i.areaTotal),
    areaConstruida: texto(i.areaConstruida),
    endereco: texto(i.endereco),
    numero: texto(i.numero),
    complemento: texto(i.complemento),
    cep: texto(i.cep),
    caracteristicas: texto(i.caracteristicas),
    destaque: Boolean(i.destaque),
  }
}

export default function Imoveis() {
  const { dados, carregando, erro, recarregar } = useCarregar(() =>
    Promise.all([listarImoveis(), listarBairros(), listarTipos()]),
  )
  const [imoveis, bairros, tipos] = dados || [[], [], []]

  const [editandoId, setEditandoId] = useState(null)
  const [campos, setCampos] = useState(VAZIO)
  const [erros, setErros] = useState({})
  const [erroForm, setErroForm] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(null)
  const [excluir, setExcluir] = useState(null)
  const [erroExcluir, setErroExcluir] = useState(null)
  const [excluindo, setExcluindo] = useState(false)
  const [busca, setBusca] = useState('')

  const alterar = (e) => {
    const { name, type, checked, value } = e.target
    setCampos((c) => ({ ...c, [name]: type === 'checkbox' ? checked : value }))
  }

  const limparFormulario = () => {
    setEditandoId(null)
    setCampos(VAZIO)
    setErros({})
    setErroForm(null)
  }

  const comecarEdicao = (imovel) => {
    setEditandoId(imovel.id)
    setCampos(deImovel(imovel))
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

    setSalvando(true)
    try {
      const corpo = paraCorpo(campos)
      if (editandoId === null) await criarImovel(corpo)
      else await atualizarImovel(editandoId, corpo)
      setSucesso(
        editandoId === null
          ? 'Imóvel cadastrado. Use "Fotos" na lista para adicionar as imagens.'
          : 'Imóvel atualizado com sucesso.',
      )
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
      await excluirImovel(excluir.id)
      if (editandoId === excluir.id) limparFormulario()
      setSucesso('Imóvel excluído com sucesso.')
      setExcluir(null)
      recarregar()
    } catch (err) {
      // 409: o imóvel já recebeu ofertas
      setErroExcluir(mensagemErro(err))
    } finally {
      setExcluindo(false)
    }
  }

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return imoveis
    return imoveis.filter((i) =>
      [i.titulo, i.endereco, i.bairro?.nome, i.tipoImovel?.nome].some((t) => t?.toLowerCase().includes(termo)),
    )
  }, [imoveis, busca])

  const campo = (nome, rotulo, extra = {}) => (
    <label className={`campo${extra.cheio ? ' campo--cheio' : ''}`}>
      <span>{rotulo}</span>
      <input
        name={nome}
        value={campos[nome]}
        onChange={alterar}
        aria-invalid={Boolean(erros[nome])}
        {...extra.entrada}
      />
      {erros[nome] && <small className="campo__erro">{erros[nome]}</small>}
    </label>
  )

  return (
    <section className="container">
      <h1 className="pagina__titulo">Imóveis</h1>

      {carregando && <Carregando texto="Carregando imóveis..." />}
      {!carregando && erro && <MensagemErro texto={erro.mensagem} onTentarNovamente={recarregar} />}

      {!carregando && !erro && (
        <>
          <form className="formulario formulario--largo" onSubmit={salvar} noValidate>
            <h2 className="formulario__titulo">{editandoId === null ? 'Novo imóvel' : 'Editar imóvel'}</h2>

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
              {campo('titulo', 'Título', { cheio: true })}

              <label className="campo">
                <span>Finalidade</span>
                <select name="finalidade" value={campos.finalidade} onChange={alterar}>
                  <option value="VENDA">Venda</option>
                  <option value="ALUGUEL">Aluguel</option>
                </select>
              </label>
              {campo('preco', campos.finalidade === 'VENDA' ? 'Preço de venda (R$)' : 'Aluguel por mês (R$)', {
                entrada: { inputMode: 'decimal', placeholder: '350000' },
              })}
              <label className="campo">
                <span>Situação</span>
                <select name="status" value={campos.status} onChange={alterar}>
                  {SITUACOES.map((s) => (
                    <option key={s} value={s}>
                      {rotuloStatus(s)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="campo">
                <span>Tipo</span>
                <select name="tipoId" value={campos.tipoId} onChange={alterar} aria-invalid={Boolean(erros.tipoId)}>
                  <option value="">Escolha...</option>
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
                {erros.tipoId && <small className="campo__erro">{erros.tipoId}</small>}
              </label>
              <label className="campo">
                <span>Bairro</span>
                <select name="bairroId" value={campos.bairroId} onChange={alterar} aria-invalid={Boolean(erros.bairroId)}>
                  <option value="">Escolha...</option>
                  {bairros.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nome} - {b.cidade}
                    </option>
                  ))}
                </select>
                {erros.bairroId && <small className="campo__erro">{erros.bairroId}</small>}
              </label>

              {campo('dormitorios', 'Dormitórios', { entrada: { inputMode: 'numeric' } })}
              {campo('banheiros', 'Banheiros', { entrada: { inputMode: 'numeric' } })}
              {campo('garagem', 'Vagas de garagem', { entrada: { inputMode: 'numeric' } })}
              {campo('areaTotal', 'Área total (m²)', { entrada: { inputMode: 'decimal' } })}
              {campo('areaConstruida', 'Área construída (m²)', { entrada: { inputMode: 'decimal' } })}

              {campo('endereco', 'Endereço')}
              {campo('numero', 'Número')}
              {campo('complemento', 'Complemento')}
              {campo('cep', 'CEP', { entrada: { inputMode: 'numeric', placeholder: '97010-000' } })}

              <label className="campo campo--cheio">
                <span>Descrição</span>
                <textarea name="descricao" rows={3} value={campos.descricao} onChange={alterar} />
              </label>
              <label className="campo campo--cheio">
                <span>Características (opcional)</span>
                <textarea name="caracteristicas" rows={2} value={campos.caracteristicas} onChange={alterar} />
              </label>
              <label className="campo campo--check">
                <input type="checkbox" name="destaque" checked={campos.destaque} onChange={alterar} />
                <span>Imóvel em destaque</span>
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

          <h2 className="secao__titulo">Imóveis cadastrados</h2>

          <div className="filtros filtros--simples">
            <label className="campo">
              <span>Buscar</span>
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Título, endereço, bairro ou tipo"
              />
            </label>
          </div>

          {visiveis.length === 0 ? (
            <SemResultados texto={busca ? 'Nenhum imóvel encontrado para essa busca.' : 'Nenhum imóvel cadastrado ainda.'} />
          ) : (
            <div className="tabela__rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Bairro</th>
                    <th>Finalidade</th>
                    <th>Valor</th>
                    <th>Situação</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((i) => (
                    <tr key={i.id}>
                      <td data-rotulo="Título">{i.titulo}</td>
                      <td data-rotulo="Tipo">{i.tipoImovel?.nome || '—'}</td>
                      <td data-rotulo="Bairro">{i.bairro?.nome || '—'}</td>
                      <td data-rotulo="Finalidade">{rotuloFinalidade(i.finalidade)}</td>
                      <td data-rotulo="Valor">{formatarPreco(valorImovel(i))}</td>
                      <td data-rotulo="Situação">
                        <span className={`badge badge--imovel-${(i.status || 'DISPONIVEL').toLowerCase()}`}>
                          {rotuloStatus(i.status)}
                        </span>
                      </td>
                      <td className="tabela__acoes">
                        <button type="button" className="botao botao--secundario botao--pequeno" onClick={() => comecarEdicao(i)}>
                          Editar
                        </button>
                        <Link className="botao botao--secundario botao--pequeno" to={`/admin/fotos?imovel=${i.id}`}>
                          Fotos
                        </Link>
                        <button
                          type="button"
                          className="botao botao--perigo-contorno botao--pequeno"
                          onClick={() => {
                            setSucesso(null)
                            setExcluir(i)
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
        </>
      )}

      {excluir && (
        <ConfirmarExclusao
          titulo="Excluir imóvel?"
          texto={`Tem certeza que deseja excluir "${excluir.titulo}"? As fotos e os favoritos dele também serão removidos. Essa ação não pode ser desfeita.`}
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

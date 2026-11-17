import PainelGestao from '../components/PainelGestao'

// Painel do admin: indicadores e gráficos, com destaque para os contratos que esperam aprovação.
export default function AreaAdmin() {
  return (
    <PainelGestao
      titulo="Painel do administrador"
      perfil="ADMIN"
      links={{ ofertas: '/admin/ofertas', contratos: '/admin/contratos' }}
      atalhos={[
        { para: '/admin/contratos', titulo: 'Contratos', descricao: 'Aprovar, reprovar, baixar o PDF e acompanhar' },
        { para: '/admin/ofertas', titulo: 'Ofertas', descricao: 'Aceitar ou recusar as ofertas dos clientes' },
        { para: '/admin/imoveis', titulo: 'Imóveis', descricao: 'Cadastrar, editar e excluir imóveis' },
        { para: '/admin/fotos', titulo: 'Fotos', descricao: 'Gerenciar as fotos de cada imóvel' },
        { para: '/admin/bairros', titulo: 'Bairros', descricao: 'Cadastrar, editar e excluir bairros' },
        { para: '/admin/tipos', titulo: 'Tipos de imóveis', descricao: 'Cadastrar, editar e excluir tipos' },
        { para: '/admin/usuarios', titulo: 'Usuários', descricao: 'Cadastrar, buscar, editar e trocar o perfil' },
      ]}
    />
  )
}

import PainelGestao from '../components/PainelGestao'

// Painel do corretor: indicadores e gráficos, com destaque para as ofertas pendentes.
export default function AreaCorretor() {
  return (
    <PainelGestao
      titulo="Painel do corretor"
      perfil="CORRETOR"
      links={{ ofertas: '/corretor/ofertas', contratos: '/corretor/contratos' }}
      atalhos={[
        { para: '/corretor/ofertas', titulo: 'Ofertas recebidas', descricao: 'Aceitar (e preparar o contrato) ou recusar' },
        { para: '/corretor/contratos', titulo: 'Contratos', descricao: 'Acompanhar aprovação e assinatura' },
      ]}
    />
  )
}

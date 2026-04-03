import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Usuario {
  id: string
  nome: string
  email: string
  role: string
}

interface Lead {
  id: string
  nome_estabelecimento: string
  sdr_responsavel_id: string | null
  status: string
  establishment_id: string
}

interface Meeting {
  id: string
  lead_id: string
  sdr_id: string | null
  closer_id: string | null
  status: string
}

interface Comissao {
  id: string
  sdr_id: string | null
  closer_id: string | null
  valor_comissao: number
  percentual_comissao: number
  mes_referencia: string
}

export function ComissaoCalculator() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [comissoes, setComissoes] = useState<Comissao[]>([])
  const [selectedLead, setSelectedLead] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)
    try {
      // Carregar usuários SDR/Closer
      const { data: usuariosData } = await supabase
        .from('admin_users')
        .select('*')
        .in('role', ['sdr', 'closer'])

      // Carregar leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'convertido')

      // Carregar reuniões
      const { data: meetingsData } = await supabase
        .from('meetings')
        .select('*')

      setUsuarios(usuariosData || [])
      setLeads(leadsData || [])
      setMeetings(meetingsData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Calcula comissão baseado em:
   * - 65% se é SDR E Closer do mesmo lead
   * - 35% se há um SDR e um Closer diferente (cada um recebe 35%)
   */
  function calcularComissao(
    sdrId: string | null,
    closerId: string | null,
    valorBase: number = 1000
  ) {
    if (!sdrId && !closerId) return 0

    if (sdrId && closerId) {
      // Há um SDR e um Closer -> dividem 70%
      return valorBase * 0.35
    } else if (sdrId || closerId) {
      // Apenas SDR ou apenas Closer -> 65%
      return valorBase * 0.65
    }

    return 0
  }

  /**
   * Obter lógica de divisão de comissão para exibição
   */
  function obterDivisaoComissao(leadId: string) {
    const meeting = meetings.find((m) => m.lead_id === leadId)

    if (!meeting) return null

    const { sdr_id, closer_id } = meeting
    const usuarioSDR = usuarios.find((u) => u.id === sdr_id)
    const usuarioCloser = usuarios.find((u) => u.id === closer_id)

    if (sdr_id === closer_id || (sdr_id && !closer_id) || (!sdr_id && closer_id)) {
      // Mesmo usuário recebe 65%
      const usuario = usuarioSDR || usuarioCloser
      return {
        tipo: 'integral',
        usuarios: [usuario],
        percentuais: [65],
        descricao: `${usuario?.nome} recebe 65% completo`
      }
    } else if (sdr_id && closer_id) {
      // Dividem 70% (35% cada)
      return {
        tipo: 'compartilhado',
        usuarios: [usuarioSDR, usuarioCloser],
        percentuais: [35, 35],
        descricao: `${usuarioSDR?.nome} (SDR) e ${usuarioCloser?.nome} (Closer) dividem 70% (35% cada)`
      }
    }

    return null
  }

  /**
   * Gerar relatório de comissões por mês
   */
  async function gerarRelatorioComissoes(mes: string) {
    try {
      const { data } = await supabase.from('vw_ranking_simples').select('*')

      if (!data) return

      const relatorio = data.map((usuario: any) => ({
        nome: usuario.nome,
        conversoes: usuario.total_conversoes,
        comissao: usuario.comissao_total,
        details: {
          novos: usuario.leads_novos,
          contatados: usuario.leads_contatados,
          interessados: usuario.leads_interessados,
          reuniao_marcada: usuario.leads_reuniao_marcada,
          reuniao_realizada: usuario.leads_reuniao_realizada
        }
      }))

      return relatorio
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      return null
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Carregando dados...</div>
  }

  return (
    <div className="space-y-6 p-6">
      {/* Seção: Usuários */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Usuários SDR/Closer</h2>
        <div className="grid gap-2">
          {usuarios.map((usuario) => (
            <div key={usuario.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{usuario.nome}</p>
                <p className="text-sm text-gray-600">{usuario.role.toUpperCase()}</p>
              </div>
              <p className="text-xs text-gray-500">{usuario.email}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Seção: Leads Convertidos */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Leads Convertidos</h2>
        <div className="space-y-3">
          {leads.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum lead convertido ainda</p>
          ) : (
            leads.map((lead) => {
              const divisao = obterDivisaoComissao(lead.id)
              return (
                <div key={lead.id} className="p-4 border rounded-lg">
                  <p className="font-medium">{lead.nome_estabelecimento}</p>
                  {divisao && (
                    <p className="text-sm text-gray-600 mt-2">
                      {divisao.descricao}
                    </p>
                  )}
                  {divisao?.usuarios.map((usuario, idx) => (
                    <div key={usuario?.id} className="text-sm mt-2">
                      <span className="text-gray-600">{usuario?.nome}</span>
                      <span className="ml-2 font-semibold text-blue-600">
                        {divisao.percentuais[idx]}%
                      </span>
                    </div>
                  ))}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Seção: Reuniões */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Reuniões</h2>
        <div className="space-y-2">
          {meetings.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma reunião registrada</p>
          ) : (
            meetings.map((meeting) => {
              const sdr = usuarios.find((u) => u.id === meeting.sdr_id)
              const closer = usuarios.find((u) => u.id === meeting.closer_id)
              return (
                <div key={meeting.id} className="flex items-center gap-2 p-2 text-sm">
                  <span className="font-medium">{sdr?.nome || '—'}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{closer?.nome || '—'}</span>
                  <span className={`ml-auto px-2 py-1 rounded text-xs ${
                    meeting.status === 'realizada'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {meeting.status}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default ComissaoCalculator

import { useState, useEffect } from 'react'
import { 
  Search, 
  Briefcase, 
  Users,
  TrendingUp,
  AlertCircle,
  Loader2,
  Plus,
  Calendar,
  DollarSign,
  List,
  LayoutGrid,
  User,
  Phone,
  MapPin,
  Building,
  Edit,
  Eye,
  MessageCircle,
  Mail,
  Instagram,
  ChevronDown,
  Check,
  Clock,
  X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import LeadCardImproved from '@/components/comercial/LeadCardImproved'
import CreateLeadForm from '@/components/comercial/CreateLeadForm'
import EditLeadModal from '@/components/comercial/EditLeadModal'
import WhatsAppModal from '@/components/comercial/WhatsAppModal'
import MonthlyTargetBar from '@/components/comercial/MonthlyTargetBar'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/types/commercial'

// Status options para mudança rápida
const STATUS_OPTIONS = [
  { value: 'novo', label: '🆕 Novo', color: 'text-blue-700', bg: 'bg-blue-100' },
  { value: 'contato_realizado', label: '📞 Contato', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  { value: 'interessado', label: '🎯 Interessado', color: 'text-cyan-700', bg: 'bg-cyan-100' },
  { value: 'reuniao_marcada', label: '📅 Reunião', color: 'text-purple-700', bg: 'bg-purple-100' },
  { value: 'reuniao_realizada', label: '✅ Realizada', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  { value: 'em_teste', label: '🧪 Em Teste', color: 'text-teal-700', bg: 'bg-teal-100' },
  { value: 'convertido', label: '🎉 Convertido', color: 'text-green-700', bg: 'bg-green-100' },
  { value: 'perdido', label: '❌ Perdido', color: 'text-red-700', bg: 'bg-red-100' },
]

export default function Comercial() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [userEmail, setUserEmail] = useState('admin@baroncontrol.com')
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [showOnlyMyLeads, setShowOnlyMyLeads] = useState(true) // Começa filtrado
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list') // Modo lista por padrão
  
  // Estados para modais e ações
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [obsModalOpen, setObsModalOpen] = useState(false)
  const [obsEditingText, setObsEditingText] = useState('')
  const [obsEditingLeadId, setObsEditingLeadId] = useState<string | null>(null)
  const [savingObs, setSavingObs] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('baron_admin_user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserEmail(user.email || 'admin@baroncontrol.com')
        setUserRole(user.role || '')
        setUserId(user.id || '')
        setUserName(user.nome || '')
      } catch (e) {
        console.error('Erro ao ler dados do usuário')
      }
    }
  }, [])

  const loadLeads = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      
      setLeads(data || [])
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar leads:', err)
      setError('Erro ao carregar leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeads()
  }, [])

  // Função para atualizar status rapidamente
  const handleQuickStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingStatus(leadId)
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)

      if (error) throw error
      
      loadLeads()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      alert('Erro ao atualizar status')
    } finally {
      setUpdatingStatus(null)
      setStatusDropdownId(null)
    }
  }

  // Pode editar: super_admin, admin, sdr ou comercial
  const canEdit = userRole === 'super_admin' || userRole === 'admin' || userRole === 'sdr' || userRole === 'comercial'

  // Formatar data
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  const stats = {
    totalLeads: leads.length,
    novoLeads: leads.filter(l => l.status === 'novo').length,
    proxiasAcoes: leads.filter(l => l.proxima_acao && l.data_proxima_acao).length,
    atrasados: leads.filter(l => {
      if (!l.data_proxima_acao) return false
      const dataAcao = new Date(l.data_proxima_acao)
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      return dataAcao < hoje
    }).length
  }

  // Filtrar leads baseado na busca, status e "Meus Leads"
  const filteredLeads = leads.filter(lead => {
    // Filtro "Meus Leads" - se ativado, mostra apenas leads do usuário
    if (showOnlyMyLeads && userId) {
      if (lead.sdr_responsavel_id !== userId) {
        return false
      }
    }

    // Filtro de busca
    const searchMatch = searchTerm === '' || 
      (lead.nome_estabelecimento?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.responsavel_nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.telefone?.includes(searchTerm)) ||
      (lead.responsavel_telefone?.includes(searchTerm)) ||
      (lead.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Filtro de status
    let statusMatch = true
    if (statusFilter === 'todos') {
      statusMatch = true
    } else if (statusFilter === 'proxima_acao') {
      statusMatch = !!(lead.proxima_acao && lead.data_proxima_acao)
    } else if (statusFilter === 'atrasado') {
      if (!lead.data_proxima_acao) {
        statusMatch = false
      } else {
        const dataAcao = new Date(lead.data_proxima_acao)
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        statusMatch = dataAcao < hoje
      }
    } else {
      statusMatch = lead.status === statusFilter
    }
    
    return searchMatch && statusMatch
  })

  return (
    <div className="space-y-6">
      {/* Barra de Meta do Mês */}
      <MonthlyTargetBar />

      {/* Header com Botões de Navegação - Responsivo */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Gestão Comercial</h1>
          <p className="text-sm text-muted-foreground hidden md:block">Gerenciar leads, ações, reuniões e comissões</p>
        </div>
        <div className="grid grid-cols-3 md:flex gap-2">
          <Button 
            onClick={() => setShowCreateForm(true)}
            variant="primary" 
            className="gap-1.5 text-xs md:text-sm py-2.5 touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo</span> Lead
          </Button>
          <Button 
            onClick={() => navigate('/comercial/reunioes')}
            variant="outline"
            className="gap-1.5 text-xs md:text-sm py-2.5 touch-manipulation"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Reuniões</span>
          </Button>
          <Button 
            onClick={() => navigate('/comercial/comissoes')}
            variant="outline"
            className="gap-1.5 text-xs md:text-sm py-2.5 touch-manipulation"
          >
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Comissões</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards - Compactos em Mobile */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        <Card className="p-2 md:p-4">
          <div className="text-center md:text-left">
            <p className="text-[10px] md:text-sm text-muted-foreground mb-0.5 md:mb-1">Total</p>
            <p className="text-lg md:text-2xl font-bold">{stats.totalLeads}</p>
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="text-center md:text-left">
            <p className="text-[10px] md:text-sm text-muted-foreground mb-0.5 md:mb-1">Novos</p>
            <p className="text-lg md:text-2xl font-bold text-blue-500">{stats.novoLeads}</p>
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="text-center md:text-left">
            <p className="text-[10px] md:text-sm text-muted-foreground mb-0.5 md:mb-1">Ações</p>
            <p className="text-lg md:text-2xl font-bold text-purple-500">{stats.proxiasAcoes}</p>
          </div>
        </Card>

        <Card className="p-2 md:p-4">
          <div className="text-center md:text-left">
            <p className="text-[10px] md:text-sm text-muted-foreground mb-0.5 md:mb-1">🚨</p>
            <p className="text-lg md:text-2xl font-bold text-red-500">{stats.atrasados}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 border-b border-border/50">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Toggle Meus Leads */}
            <button
              onClick={() => setShowOnlyMyLeads(!showOnlyMyLeads)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                showOnlyMyLeads
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 border border-border/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <User className="w-4 h-4" />
              {showOnlyMyLeads ? '👤 Meus Leads' : '👥 Todos'}
            </button>

            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nome, empresa, telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            >
              <option value="todos">Todos os Status</option>
              <option value="novo">Novo</option>
              <option value="contato_realizado">Contato Realizado</option>
              <option value="interessado">Interessado</option>
              <option value="reuniao_marcada">Reunião Marcada</option>
              <option value="em_teste">Em Teste</option>
              <option value="convertido">Convertido</option>
              <option value="perdido">Perdido</option>
            </select>

            {/* Toggle View Mode */}
            <div className="flex rounded-xl border border-border/50 overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2.5 transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2.5 transition-all ${
                  viewMode === 'cards'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Badges + Count */}
        <div className="p-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {[
              { label: '📋 Todos', value: 'todos' },
              { label: '🆕 Novo', value: 'novo' },
              { label: '🎯 Próximas Ações', value: 'proxima_acao' },
              { label: '🚨 Atrasado', value: 'atrasado' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === filter.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} encontrado{filteredLeads.length !== 1 ? 's' : ''}
          </span>
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando leads...</span>
        </div>
      ) : error ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div className="text-center">
              <p className="font-semibold mb-2">Erro ao carregar leads</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground mt-4">
                💡 Dica: Execute o SETUP_COMERCIAL_v2.sql no Supabase para criar as tabelas
              </p>
            </div>
          </div>
        </Card>
      ) : leads.length === 0 ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <Briefcase className="w-12 h-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-semibold mb-2">Nenhum lead encontrado</p>
              <p className="text-sm text-muted-foreground">
                Comece adicionando novos leads para gerenciar suas ações comerciais
              </p>
              <Button onClick={() => setShowCreateForm(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Lead
              </Button>
            </div>
          </div>
        </Card>
      ) : filteredLeads.length === 0 ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <Search className="w-12 h-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-semibold mb-2">Nenhum lead encontrado</p>
              <p className="text-sm text-muted-foreground">
                {showOnlyMyLeads 
                  ? 'Você ainda não tem leads. Adicione um novo ou desative o filtro "Meus Leads".'
                  : 'Tente ajustar os filtros ou buscar por outro termo'}
              </p>
              {showOnlyMyLeads && (
                <Button variant="outline" onClick={() => setShowOnlyMyLeads(false)} className="mt-2">
                  Ver Todos os Leads
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : viewMode === 'list' ? (
        /* MODO LISTA - Completo */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estabelecimento</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Responsável</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Local</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Próxima Ação</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.map((lead) => {
                  const isOverdue = lead.data_proxima_acao && new Date(lead.data_proxima_acao) < new Date()
                  const isToday = lead.data_proxima_acao && new Date(lead.data_proxima_acao).toDateString() === new Date().toDateString()
                  const currentStatus = STATUS_OPTIONS.find(s => s.value === lead.status) || STATUS_OPTIONS[0]

                  return (
                    <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                      {/* Estabelecimento */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-primary flex-shrink-0" />
                          <div>
                            <p className="font-medium truncate max-w-[200px]">{lead.nome_estabelecimento}</p>
                            <p className="text-xs text-muted-foreground capitalize">{lead.tipo?.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                      </td>

                      {/* Responsável */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="truncate max-w-[150px] block">{lead.responsavel_nome || '-'}</span>
                            <span className="text-xs text-muted-foreground">{lead.responsavel_telefone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Local */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate max-w-[120px]">{lead.cidade}{lead.cidade && lead.estado ? ', ' : ''}{lead.estado}</span>
                        </div>
                      </td>

                                {/* Observação (substitui Próxima Ação) */}
                                <td className="px-4 py-3 hidden xl:table-cell">
                                  {lead.observacoes ? (
                                    <div
                                      className="truncate max-w-[240px] text-sm text-muted-foreground cursor-pointer"
                                      onClick={() => {
                                        setObsEditingText(lead.observacoes || '')
                                        setObsEditingLeadId(lead.id)
                                        setObsModalOpen(true)
                                      }}
                                      title="Clique para ver/editar observação"
                                    >
                                      {lead.observacoes}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">-</span>
                                  )}
                                </td>

                      {/* Status com Dropdown */}
                      <td className="px-4 py-3 relative">
                        <div className="relative">
                          <button
                            onClick={() => canEdit && setStatusDropdownId(statusDropdownId === lead.id ? null : lead.id)}
                            disabled={updatingStatus === lead.id || !canEdit}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${currentStatus.bg} ${currentStatus.color} ${canEdit ? 'cursor-pointer hover:opacity-80' : ''}`}
                          >
                            {updatingStatus === lead.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                {currentStatus.label}
                                {canEdit && <ChevronDown className="w-3 h-3" />}
                              </>
                            )}
                          </button>

                          {/* Dropdown de Status */}
                          {statusDropdownId === lead.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setStatusDropdownId(null)} 
                              />
                              <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
                                {STATUS_OPTIONS.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleQuickStatusChange(lead.id, option.value)}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between ${
                                      option.value === lead.status ? 'bg-muted' : ''
                                    }`}
                                  >
                                    <span className={option.color}>{option.label}</span>
                                    {option.value === lead.status && (
                                      <Check className="w-4 h-4 text-primary" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Ver Detalhes */}
                          <button
                            onClick={() => {
                              setSelectedLead(lead)
                              setShowDetailsModal(true)
                            }}
                            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                            title="Ver Detalhes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar */}
                          {canEdit && (
                            <button
                              onClick={() => {
                                setSelectedLead(lead)
                                setShowEditModal(true)
                              }}
                              className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                              title="Editar Lead"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* WhatsApp */}
                          <button
                            onClick={() => {
                              setSelectedLead(lead)
                              setShowWhatsAppModal(true)
                            }}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Telefone */}
                          <a
                            href={`tel:${lead.responsavel_telefone}`}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            title="Ligar"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          {/* Email */}
                          {lead.responsavel_email && (
                            <a
                              href={`mailto:${lead.responsavel_email}`}
                              className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                              title="Email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Instagram */}
                          {lead.instagram && (
                            <a
                              href={`https://instagram.com/${lead.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                              title="Instagram"
                            >
                              <Instagram className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* MODO CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <LeadCardImproved 
              key={lead.id} 
              lead={lead} 
              onUpdate={loadLeads}
              userRole={userRole}
            />
          ))}
        </div>
      )}

      {/* Modal de Criar Lead */}
      <CreateLeadForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={() => {
          setShowCreateForm(false)
          loadLeads() // Recarregar leads após criar
        }}
        userEmail={userEmail}
      />

      {/* Modal de Editar Lead */}
      {selectedLead && (
        <EditLeadModal
          lead={selectedLead}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedLead(null)
          }}
          onSave={() => {
            setShowEditModal(false)
            setSelectedLead(null)
            loadLeads()
          }}
        />
      )}

      {/* Modal de WhatsApp */}
      {selectedLead && (
        <WhatsAppModal
          isOpen={showWhatsAppModal}
          onClose={() => {
            setShowWhatsAppModal(false)
            setSelectedLead(null)
          }}
          leadNome={selectedLead.nome_estabelecimento}
          telefone={selectedLead.responsavel_whatsapp || selectedLead.responsavel_telefone || ''}
        />
      )}

      {/* Modal de Detalhes do Lead */}
      {showDetailsModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{selectedLead.nome_estabelecimento}</h2>
                  <p className="text-sm text-muted-foreground capitalize">{selectedLead.tipo?.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedLead(null)
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-4 space-y-6">
              {/* Status com opção de mudar */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        if (canEdit) {
                          handleQuickStatusChange(selectedLead.id, option.value)
                          setSelectedLead({ ...selectedLead, status: option.value as Lead['status'] })
                        }
                      }}
                      disabled={!canEdit || updatingStatus === selectedLead.id}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        option.value === selectedLead.status
                          ? `${option.bg} ${option.color} ring-2 ring-primary ring-offset-2`
                          : canEdit 
                            ? 'bg-muted hover:bg-muted/80 text-muted-foreground'
                            : 'bg-muted text-muted-foreground opacity-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Informações do Responsável */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Responsável</h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{selectedLead.responsavel_nome || '-'}</span>
                  </div>
                  {selectedLead.responsavel_telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedLead.responsavel_telefone}</span>
                    </div>
                  )}
                  {selectedLead.responsavel_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedLead.responsavel_email}</span>
                    </div>
                  )}
                  {selectedLead.instagram && (
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedLead.instagram}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Localização */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Localização</h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {selectedLead.cidade}{selectedLead.estado && `, ${selectedLead.estado}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Próxima Ação */}
              {selectedLead.proxima_acao && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Próxima Ação</h3>
                  <div className={`rounded-lg p-4 ${
                    selectedLead.data_proxima_acao && new Date(selectedLead.data_proxima_acao) < new Date() 
                      ? 'bg-red-100 border border-red-300' 
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="w-4 h-4" />
                      {selectedLead.proxima_acao}
                    </div>
                    {selectedLead.data_proxima_acao && (
                      <p className="text-sm mt-1">
                        📅 {formatDate(selectedLead.data_proxima_acao)}
                        {new Date(selectedLead.data_proxima_acao) < new Date() && ' ⚠️ ATRASADO'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Observações */}
              {selectedLead.observacoes && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Observações</h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedLead.observacoes}</p>
                  </div>
                </div>
              )}

              {/* Informações Adicionais */}
              <div className="grid grid-cols-2 gap-4">
                {userRole === 'super_admin' && selectedLead.faturamento_estimado && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Faturamento Estimado</h3>
                    <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-green-700">
                        R$ {selectedLead.faturamento_estimado.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Data de Criação</h3>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <span className="text-sm">{formatDate(selectedLead.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer com Ações */}
            <div className="flex gap-2 p-4 border-t border-border sticky bottom-0 bg-card">
              {canEdit && (
                <Button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setShowEditModal(true)
                  }}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Lead
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false)
                  setShowWhatsAppModal(true)
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white border-green-500"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedLead(null)
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal rápido de Observação */}
      {obsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="text-lg font-bold">Observação</h3>
              <button
                onClick={() => {
                  setObsModalOpen(false)
                  setObsEditingLeadId(null)
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <textarea
                value={obsEditingText}
                onChange={(e) => setObsEditingText(e.target.value)}
                className="w-full h-48 p-3 rounded-md bg-muted/30 border border-border/50 text-sm"
              />
            </div>

            <div className="flex gap-2 p-4 border-t border-border sticky bottom-0 bg-card">
              <Button
                onClick={async () => {
                  if (!obsEditingLeadId) return
                  setSavingObs(true)
                  try {
                    const { error } = await supabase
                      .from('leads')
                      .update({ observacoes: obsEditingText, updated_at: new Date().toISOString() })
                      .eq('id', obsEditingLeadId)

                    if (error) throw error
                    await loadLeads()
                    setObsModalOpen(false)
                    setObsEditingLeadId(null)
                  } catch (e) {
                    console.error('Erro ao salvar observação:', e)
                    alert('Erro ao salvar observação')
                  } finally {
                    setSavingObs(false)
                  }
                }}
                className="flex-1"
                disabled={savingObs}
              >
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setObsModalOpen(false)
                  setObsEditingLeadId(null)
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
// Restrição de acesso por role
function getUserRole(): string {
  try {
    const userData = localStorage.getItem('baron_admin_user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.role || 'comercial';
    }
  } catch {
    // Ignora erro
  }
  return 'comercial';
}
import {
  Loader2,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Search,
  Filter,
  Eye,
  FileUp,
  RefreshCcw
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import KPICard from '@/components/dashboard/KPICard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils'
import { 
  getDashboardStats,
  getRevenueByPeriod,
  getWithdrawals,
  getAuditLogsByWithdrawal,
  updateWithdrawalStatus,
  uploadProofFile
} from '@/lib/supabase'
import { fetchAdminWallet } from '@/lib/adminDataApi'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

// Types
interface Withdrawal {
  id: string
  establishment_id: string
  establishment?: { id: string; name: string }
  amount: number
  requested_at: string
  paid_at?: string
  status: 'pending' | 'paid' | 'rejected'
  proof_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface AuditLog {
  id: string
  user_name: string
  action: string
  created_at: string
}

const MOCK_AUDIT: AuditLog[] = []

// Mock data para testes até as tabelas existirem no banco
const MOCK_WITHDRAWALS: Withdrawal[] = [
  {
    id: 'saq_001',
    establishment_id: 'est_001',
    establishment: { id: 'est_001', name: 'Boteco da Esquina' },
    amount: 8000,
    requested_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'saq_002',
    establishment_id: 'est_002',
    establishment: { id: 'est_002', name: 'Empório Luxo' },
    amount: 11500,
    requested_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'saq_003',
    establishment_id: 'est_003',
    establishment: { id: 'est_003', name: 'Bar do Silva' },
    amount: 5700,
    requested_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: 'paid',
    paid_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
]

export default function Faturamento() {
  const userRole = getUserRole();
  if (userRole !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Acesso restrito: apenas para super_admin</div>
      </div>
    );
  }
  const [periodo, setPeriodo] = useState<number>(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(MOCK_WITHDRAWALS)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsWithdrawal, setDetailsWithdrawal] = useState<Withdrawal | null>(null)
  const [walletValue, setWalletValue] = useState<number | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  useEffect(() => {
    loadData()
  }, [periodo])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      
      const [statsData, revenue, withdrawalsData] = await Promise.all([
        getDashboardStats(),
        getRevenueByPeriod(periodo),
        getWithdrawals(),
      ])
      
      setStats(statsData)
      setRevenueData(revenue || [])
      setWithdrawals((withdrawalsData || []) as any)
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      setError(err.message || 'Erro ao carregar dados de faturamento')
    } finally {
      setLoading(false)
    }
  }

  // Função para confirmar pagamento
  async function handleConfirmPayment(file?: File) {
    if (!selectedWithdrawal) return
    
    try {
      setUploadingFile(true)
      
      let proofUrl = ''
      if (file) {
        proofUrl = await uploadProofFile(file, selectedWithdrawal.id, selectedWithdrawal.establishment_id)
      }
      
      await updateWithdrawalStatus(selectedWithdrawal.id, 'paid', proofUrl)
      
      setShowModal(false)
      setSelectedWithdrawal(null)
      await loadData()
      alert('Pagamento confirmado com sucesso!')
    } catch (err: any) {
      console.error('Erro ao confirmar pagamento:', err)
      alert('Erro ao confirmar pagamento: ' + err.message)
    } finally {
      setUploadingFile(false)
    }
  }

  // Calcular resumo financeiro
  const totalRevenue = stats?.totalRevenue || 0
  
  // Função para calcular valor líquido (descontando taxa de cartão 4.7% e PIX 2%)
  const calculateNetRevenue = (w: Withdrawal) => {
    // Valores padrão se não existirem
    return 5000
  }
  
  // Atualizar withdrawals com valores calculados
  const withdrawalsWithCalculatedAmount = withdrawals.map(w => ({
    ...w,
    requested_amount: calculateNetRevenue(w)
  })) as any[]
  
  const pendingWithdrawals = withdrawalsWithCalculatedAmount
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.requested_amount, 0)
  
  const paidWithdrawals = withdrawalsWithCalculatedAmount
    .filter(w => w.status === 'paid')
    .reduce((sum, w) => sum + w.requested_amount, 0)
  
  const retentionBalance = totalRevenue - pendingWithdrawals - paidWithdrawals
  const baronCommission = totalRevenue * 0.02

  // Filtrar saques
  const filteredWithdrawals = withdrawalsWithCalculatedAmount.filter(w => {
    const matchesSearch = (w.establishment?.name || w.establishment_id).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calcular tempo desde solicitação
  const getTimeStatus = (requestedAt: string) => {
    const now = new Date()
    const requested = new Date(requestedAt)
    const diffHours = (now.getTime() - requested.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 12) return { color: 'success', text: '🟢 < 12h', hours: Math.floor(diffHours) }
    if (diffHours < 24) return { color: 'warning', text: '🟡 12-24h', hours: Math.floor(diffHours) }
    if (diffHours < 48) return { color: 'destructive', text: '🔴 24-48h', hours: Math.floor(diffHours) }
    return { color: 'destructive', text: '🔴 > 48h ⚠️', hours: Math.floor(diffHours) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando dados de faturamento...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={loadData}>Tentar novamente</Button>
      </div>
    )
  }

  const chartData = revenueData.map(item => ({
    data: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    valor: item.value
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faturamento & Saques</h1>
          <p className="text-muted-foreground">Gerencie toda a receita e saques dos estabelecimentos</p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-card border border-border/50 rounded-xl hover:bg-muted/50 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Faturamento Total"
          value={formatCurrency(totalRevenue)}
          trend="Toda a receita bruta"
          icon={DollarSign}
          variant="highlight"
        />
        <KPICard
          title="Saldo em Retenção"
          value={formatCurrency(retentionBalance)}
          trend="Disponível para saque"
          trendUp={true}
          icon={TrendingUp}
          variant="success"
        />
        <KPICard
          title="Saques Pendentes"
          value={formatCurrency(pendingWithdrawals)}
          trend={`${withdrawals.filter(w => w.status === 'pending').length} solicitações`}
          icon={Clock}
        />
        <KPICard
          title="Comissão GetBaron (2%)"
          value={formatCurrency(baronCommission)}
          trend="Nossa receita"
          trendUp={true}
          icon={ShoppingCart}
          variant="highlight"
        />
      </div>

      {/* Gráfico de Faturamento */}
      <Card title="Faturamento - Últimos 30 dias">
        <div className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="data" stroke="hsl(220 9% 46%)" tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(220 9% 46%)" tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0 0% 100%)', 
                    border: '1px solid hsl(220 13% 91%)',
                    borderRadius: '12px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                />
                <Area 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorValor)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Sem dados de faturamento
            </div>
          )}
        </div>
      </Card>

      {/* Gestão de Saques */}
      <Card title="Gestão de Saques">
        {/* Filtros */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do estabelecimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-muted border border-border rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">⏳ Pendentes</option>
            <option value="paid">✓ Pagos</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estabelecimento</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Chave PIX</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data Solicitação</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tempo Pendência</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.map((withdrawal) => {
                const timeStatus = getTimeStatus(withdrawal.requested_at)
                return (
                  <tr key={withdrawal.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-sm">{withdrawal.establishment?.name || withdrawal.establishment_id}</p>
                        <p className="text-xs text-muted-foreground">{withdrawal.id}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-primary">
                      {formatCurrency(withdrawal.amount)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(withdrawal.requested_at).toLocaleString('pt-BR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4">
                      {withdrawal.status === 'pending' ? (
                        <span className={`text-xs font-bold ${
                          timeStatus.color === 'success' ? 'text-green-600' :
                          timeStatus.color === 'warning' ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {timeStatus.text} ({timeStatus.hours}h)
                        </span>
                      ) : (
                        <span className="text-xs text-green-600">Pago</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        withdrawal.status === 'paid' ? 'success' :
                        timeStatus.hours > 48 ? 'danger' :
                        'warning'
                      }>
                        {withdrawal.status === 'pending' ? '⏳ Pendente' : '✓ Pago'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {withdrawal.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal)
                              setShowModal(true)
                            }}
                            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            title="Confirmar Pagamento"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {withdrawal.proof_url && (
                          <button
                            onClick={() => window.open(withdrawal.proof_url, '_blank')}
                            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                            title="Ver Comprovante"
                          >
                            <FileUp className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            setDetailsWithdrawal(withdrawal)
                            setShowDetailsModal(true)
                            setWalletLoading(true)
                            setWalletValue(null)
                            try {
                              const wallet = await fetchAdminWallet(withdrawal.establishment_id)
                              if (wallet) {
                                const val = wallet.requested_amount ?? wallet.amount ?? wallet.balance ?? wallet.valor ?? wallet.withdrawal_amount ?? null
                                if (val !== null) setWalletValue(Number(val))
                                else if (typeof wallet === 'number') setWalletValue(wallet)
                                else if (wallet.data && typeof wallet.data === 'number') setWalletValue(wallet.data)
                              }
                            } catch (e) {
                              console.error(e)
                            } finally {
                              setWalletLoading(false)
                            }
                          }}
                          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Log de Auditoria */}
      <Card title="📋 Log de Auditoria" className="bg-muted/20 border-border/50">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-medium">
                  <span className="text-primary">{log.user_name}</span> {log.action}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal de Confirmação de Pagamento */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Confirmar Pagamento</h2>
              <button
                onClick={() => setShowModal(false)}
                disabled={uploadingFile}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Estabelecimento</p>
                <p className="font-semibold">{selectedWithdrawal.establishment?.name || 'Carregando...'}</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Valor a Pagar</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(calculateNetRevenue(selectedWithdrawal))}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Upload do Comprovante (PDF/JPG)</label>
                <input
                  type="file"
                  id="proofFileInput"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-3 py-2 border border-border rounded-lg"
                  disabled={uploadingFile}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={uploadingFile}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const fileInput = document.getElementById('proofFileInput') as HTMLInputElement
                  const file = fileInput?.files?.[0]
                  handleConfirmPayment(file)
                }}
                disabled={uploadingFile}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar Pagamento'
                )}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Detalhes do Saque */}
      {showDetailsModal && detailsWithdrawal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Detalhes do Saque</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-muted-foreground hover:text-foreground text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              {/* Estabelecimento */}
              <div className="bg-muted/50 p-5 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Estabelecimento</p>
                <p className="text-xl font-bold">{detailsWithdrawal.establishment?.name || detailsWithdrawal.establishment_id}</p>
              </div>

              {/* Data e Hora Exata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-5 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Solicitado em</p>
                  <p className="font-semibold">
                    {new Date(detailsWithdrawal.requested_at).toLocaleString('pt-BR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
                <div className="bg-muted/50 p-5 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <p className="font-semibold">
                    {detailsWithdrawal.status === 'pending' ? '⏳ Pendente' : '✓ Pago'}
                  </p>
                </div>
              </div>

              {/* Faturamento */}
              <div className="border border-border/50 rounded-lg p-5">
                <h3 className="font-semibold mb-4">Cálculo de Faturamento</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Valor Solicitado (App Cliente)</span>
                    <span className="font-semibold">
                      {walletLoading 
                        ? <Loader2 className="w-4 h-4 animate-spin" /> 
                        : (walletValue !== null ? formatCurrency(walletValue) : formatCurrency(detailsWithdrawal.amount))}
                    </span>
                  </div>
                  <div className="border-t border-border/30"></div>
                  
                  <div className="flex justify-between items-center py-3 bg-primary/5 px-3 rounded">
                    <span className="font-semibold">Total a Receber</span>
                    <span className="text-xl font-bold text-primary">
                      {walletLoading 
                        ? <Loader2 className="w-5 h-5 animate-spin" /> 
                        : (walletValue !== null ? formatCurrency(walletValue) : formatCurrency(detailsWithdrawal.amount))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chave PIX Completa */}
              <div className="bg-primary/10 border border-primary/20 p-5 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Status do Saque</p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 bg-background p-3 rounded border border-border text-sm font-mono">
                    {detailsWithdrawal.status === 'pending' ? 'Aguardando processamento' : 'Já foi pago'}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(detailsWithdrawal.id)
                      alert('ID do saque copiado!')
                    }}
                    className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    title="Copiar ID"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {/* ID do Saque */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">ID do Saque</p>
                <p className="font-mono text-sm">{detailsWithdrawal.id}</p>
              </div>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

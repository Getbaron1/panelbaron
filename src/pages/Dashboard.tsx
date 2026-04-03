import { useState, useEffect } from 'react'
import { 
  Building2, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Users,
  Package,
  CreditCard,
  Loader2,
  RefreshCcw,
  Eye,
  Edit,
  MoreVertical
} from 'lucide-react'
import KPICard from '@/components/dashboard/KPICard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { 
  getDashboardStats, 
  getOrders, 
  getEstablishments,
  getRevenueByPeriod,
  getTopProducts
} from '@/lib/supabase'
import type { Establishment } from '@/integrations/supabase/types'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const HEALTH_CHECK_INTERVAL_MS = 60000
const LATENCY_DANGER_THRESHOLD_MS = 2000
const HEALTH_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/health`
const NETLIFY_STATUS_BADGE_URL =
  import.meta.env.VITE_NETLIFY_STATUS_BADGE_URL ||
  'https://api.netlify.com/api/v1/badges/SEU_SITE_ID/deploy-status'

type HealthStatus = 'ok' | 'danger' | 'checking'

interface DashboardStats {
  totalEstablishments: number
  activeEstablishments: number
  mercadoPagoConnected: number
  newThisMonth: number
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  ordersToday: number
  totalRevenue: number
  platformFees: number
  revenueThisMonth: number
  ticketMedio: number
  totalProducts: number
  availableProducts: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<{ date: string; value: number }[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEstablishment, setSelectedEstablishment] = useState<string | null>(null)
  const [healthLatencyMs, setHealthLatencyMs] = useState<number | null>(null)
  const [healthMessage, setHealthMessage] = useState('Verificando latência...')
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('checking')
  const [healthCheckedAt, setHealthCheckedAt] = useState<string | null>(null)

  const selected = selectedEstablishment ? establishments.find(e => e.id === selectedEstablishment) ?? null : null

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    let isActive = true

    const checkHealth = async () => {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        if (!isActive) return
        setHealthStatus('danger')
        setHealthLatencyMs(null)
        setHealthMessage('PERIGO: Gargalo no Supabase')
        return
      }

      if (isActive) setHealthStatus('checking')

      const startedAt = performance.now()
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 10000)

      try {
        const response = await fetch(HEALTH_ENDPOINT, {
          method: 'GET',
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
          },
          signal: controller.signal
        })

        const elapsed = Math.round(performance.now() - startedAt)
        if (!isActive) return

        setHealthLatencyMs(elapsed)
        setHealthCheckedAt(new Date().toISOString())

        if (!response.ok || elapsed > LATENCY_DANGER_THRESHOLD_MS) {
          setHealthStatus('danger')
          setHealthMessage('PERIGO: Gargalo no Supabase')
          return
        }

        const payload = await response.json()
        if (payload?.db_check !== 1) {
          setHealthStatus('danger')
          setHealthMessage('PERIGO: Gargalo no Supabase')
          return
        }

        setHealthStatus('ok')
        setHealthMessage(`Latência: ${elapsed}ms - Sistema Voando`)
      } catch {
        if (!isActive) return
        setHealthStatus('danger')
        setHealthLatencyMs(null)
        setHealthCheckedAt(new Date().toISOString())
        setHealthMessage('PERIGO: Gargalo no Supabase')
      } finally {
        window.clearTimeout(timeoutId)
      }
    }

    checkHealth()
    const intervalId = window.setInterval(checkHealth, HEALTH_CHECK_INTERVAL_MS)
    return () => {
      isActive = false
      window.clearInterval(intervalId)
    }
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)
      setError(null)

      const [statsResult, establishmentsResult, ordersResult, revenueResult, topProductsResult] = await Promise.allSettled([
        getDashboardStats(),
        getEstablishments(),
        getOrders(),
        getRevenueByPeriod(30),
        getTopProducts(5)
      ])

      setStats(statsResult.status === 'fulfilled' ? statsResult.value : {
        totalEstablishments: 0,
        activeEstablishments: 0,
        mercadoPagoConnected: 0,
        newThisMonth: 0,
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        ordersToday: 0,
        totalRevenue: 0,
        platformFees: 0,
        revenueThisMonth: 0,
        ticketMedio: 0,
        totalProducts: 0,
        availableProducts: 0,
      })
      setEstablishments(establishmentsResult.status === 'fulfilled' ? establishmentsResult.value || [] : [])
      setRecentOrders(ordersResult.status === 'fulfilled' ? (ordersResult.value || []).slice(0, 10) : [])
      setRevenueData(revenueResult.status === 'fulfilled' ? revenueResult.value : [])
      setTopProducts(topProductsResult.status === 'fulfilled' ? topProductsResult.value : [])

      if (
        statsResult.status === 'rejected' &&
        establishmentsResult.status === 'rejected' &&
        ordersResult.status === 'rejected'
      ) {
        setError('API conectada, mas os endpoints de estabelecimentos/pedidos ainda nao foram configurados.')
      }
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err)
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando dados...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-destructive mb-4">{error}</p>
        <button 
          onClick={loadDashboardData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Tentar novamente
        </button>
      </div>
    )
  }

  // Filtrar dados se um estabelecimento está selecionado
  const filteredOrders = selected 
    ? recentOrders.filter(order => order.establishment_id === selected.id)
    : recentOrders

  // Calcular stats filtrados
  const displayStats = selected ? {
    totalEstablishments: 1,
    activeEstablishments: selected.status === 'active' ? 1 : 0,
    newThisMonth: 0,
    totalOrders: filteredOrders.length,
    completedOrders: filteredOrders.filter((o: any) => o.status === 'completed' || o.status === 'delivered').length,
    pendingOrders: filteredOrders.filter((o: any) => o.status === 'pending').length,
    ordersToday: filteredOrders.filter((o: any) => new Date(o.created_at).toDateString() === new Date().toDateString()).length,
    totalRevenue: filteredOrders.reduce((acc: number, o: any) => acc + (o.total || 0), 0),
    platformFees: calculatePlatformFees(filteredOrders),
    revenueThisMonth: filteredOrders.filter((o: any) => new Date(o.created_at).getMonth() === new Date().getMonth()).reduce((acc: number, o: any) => acc + (o.total || 0), 0),
    ticketMedio: filteredOrders.length > 0 ? filteredOrders.reduce((acc: number, o: any) => acc + (o.total || 0), 0) / filteredOrders.length : 0,
    totalProducts: 0,
    availableProducts: 0,
  } : stats

  // Função para calcular taxa da plataforma (4.7% cartão + 2% pix)
  function calculatePlatformFees(orders: any[]): number {
    return orders.reduce((total, order) => {
      const cardAmount = order.payment_method === 'card' ? (order.total || 0) : 0
      const pixAmount = order.payment_method === 'pix' ? (order.total || 0) : 0
      const cardFee = cardAmount * 0.047
      const pixFee = pixAmount * 0.02
      return total + cardFee + pixFee
    }, 0)
  }

  // Dados para o gráfico de pizza de status dos estabelecimentos
  const establishmentStatusData = [
    { name: 'Ativos', value: displayStats?.activeEstablishments || 0, color: 'hsl(142 76% 36%)' },
    { name: 'Inativos', value: (displayStats?.totalEstablishments || 0) - (displayStats?.activeEstablishments || 0), color: 'hsl(220 9% 46%)' },
  ]

  // Formatar dados de receita para o gráfico
  const formattedRevenueData = revenueData.map(item => ({
    data: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    valor: item.value
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            {selected && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{selected.name}</span>
              </div>
            )}
          </div>
          <p className="text-muted-foreground">
            {selected 
              ? `Detalhes de ${selected.name}` 
              : 'Visão geral do sistema Baron Control'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected && (
            <button 
              onClick={() => setSelectedEstablishment(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-xl transition-colors"
            >
              ← Voltar
            </button>
          )}
          <button 
            onClick={loadDashboardData}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-card border border-border/50 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                healthStatus === 'ok'
                  ? 'bg-green-500'
                  : healthStatus === 'checking'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500'
              }`}
            />
            <div>
              <p className={`font-semibold ${healthStatus === 'danger' ? 'text-red-600' : ''}`}>
                {healthMessage}
              </p>
              <p className="text-xs text-muted-foreground">
                Última checagem:{' '}
                {healthCheckedAt ? new Date(healthCheckedAt).toLocaleTimeString('pt-BR') : '-'}
                {healthLatencyMs !== null ? ` - ${healthLatencyMs}ms` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            {NETLIFY_STATUS_BADGE_URL.includes('SEU_SITE_ID') ? (
              <p className="text-xs text-muted-foreground">
                Configure `VITE_NETLIFY_STATUS_BADGE_URL` para mostrar o selo da Netlify.
              </p>
            ) : (
              <img
                src={NETLIFY_STATUS_BADGE_URL}
                alt="Status da Netlify"
                className="h-6 w-auto"
                loading="lazy"
              />
            )}
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {!selected && (
          <KPICard
            title="Total de Estabelecimentos"
            value={displayStats?.totalEstablishments || 0}
            trend={`+${displayStats?.newThisMonth || 0} este mês`}
            trendUp={true}
            icon={Building2}
            variant="highlight"
          />
        )}

        <KPICard
          title="Faturamento Total"
          value={formatCurrency(displayStats?.totalRevenue || 0)}
          trend={`${formatCurrency(displayStats?.revenueThisMonth || 0)} este mês`}
          trendUp={true}
          icon={DollarSign}
          variant="highlight"
        />
        <KPICard
          title="Taxa da Plataforma"
          value={formatCurrency(displayStats?.platformFees || 0)}
          trend={selected ? "Receita deste estabelecimento" : "Receita total Baron"}
          trendUp={true}
          icon={CreditCard}
          variant="success"
        />
      </div>



      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Faturamento Chart */}
        <Card className="lg:col-span-2" title="Faturamento - Últimos 30 dias">
          <div className="h-80">
            {formattedRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedRevenueData}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0 84% 50%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(0 84% 50%)" stopOpacity={0}/>
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
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="hsl(0 84% 50%)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValor)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Sem dados de faturamento no período
              </div>
            )}
          </div>
        </Card>

        {/* Status dos Estabelecimentos */}
        <Card title="Status dos Estabelecimentos">
          <div className="h-80 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={establishmentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {establishmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0 0% 100%)', 
                    border: '1px solid hsl(220 13% 91%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-4">
              {establishmentStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Produtos */}
        <Card title="Top 5 Produtos Mais Vendidos">
          <div className="h-64">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                  <XAxis type="number" stroke="hsl(220 9% 46%)" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="hsl(220 9% 46%)" 
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(0 0% 100%)', 
                      border: '1px solid hsl(220 13% 91%)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'quantity' ? `${value} vendidos` : formatCurrency(value),
                      name === 'quantity' ? 'Quantidade' : 'Receita'
                    ]}
                  />
                  <Bar dataKey="quantity" fill="hsl(0 84% 50%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Sem dados de produtos vendidos
              </div>
            )}
          </div>
        </Card>

        {/* Últimos Estabelecimentos */}
        <Card title="Últimos Estabelecimentos Cadastrados">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {(establishments as Establishment[]).slice(0, 10).map((est: Establishment) => (
              <div 
                key={est.id}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  selectedEstablishment === est.id
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-muted/30 border-transparent hover:border-border/50'
                }`}
              >
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => setSelectedEstablishment(est.id)}
                >
                  {est.logo_url ? (
                    <img src={est.logo_url} alt={est.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{est.name}</p>
                    <p className="text-xs text-muted-foreground">{est.slug}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={est.status === 'active' ? 'success' : est.status === 'pending' ? 'warning' : 'default'}>
                        {est.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Ações */}
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => setSelectedEstablishment(est.id)}
                    title="Filtrar por este estabelecimento"
                    className={`p-2 rounded-lg transition-colors ${
                      selectedEstablishment === est.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => window.open(`/estabelecimentos/${est.id}`, '_blank')}
                    title="Visualizar detalhes completos"
                    className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  <button
                    title="Editar estabelecimento"
                    className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    title="Mais opções"
                    className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {establishments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum estabelecimento cadastrado</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card title={selected ? `Pedidos de ${selected.name}` : "Últimos Pedidos"}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Código</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cliente</th>
                {!selected && (
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estabelecimento</th>
                )}
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pagamento</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-mono text-primary font-medium">
                    {order.order_code || order.id.slice(0, 8)}
                  </td>
                  <td className="py-3 px-4 text-sm">{order.customer_name || '-'}</td>
                  {!selectedEstablishment && (
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {order.establishment?.name || '-'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-sm font-medium text-primary">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={
                      order.payment_status === 'approved' || order.payment_status === 'paid' ? 'success' :
                      order.payment_status === 'pending' ? 'warning' : 'default'
                    }>
                      {order.payment_status || 'pending'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={
                      order.status === 'completed' || order.status === 'delivered' ? 'success' :
                      order.status === 'preparing' ? 'warning' :
                      order.status === 'pending' ? 'default' :
                      order.status === 'cancelled' ? 'danger' : 'default'
                    }>
                      {order.status || 'pending'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {formatDateTime(order.created_at)}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={selected ? 6 : 7} className="py-8 text-center text-muted-foreground">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

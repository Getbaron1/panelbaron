import { useState, useEffect } from 'react'
import { 
  Search, 
  ShoppingBag, 
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Truck,
  Loader2,
  KeyRound,
  Copy,
  AlertTriangle
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getOrders, getEstablishments } from '@/lib/supabase'
import type { Order, Establishment } from '@/integrations/supabase/types'

export default function Pedidos() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [estabelecimentoFilter, setEstabelecimentoFilter] = useState<string>('todos')
  const [orders, setOrders] = useState<Order[]>([])
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [ordersData, establishmentsData] = await Promise.all([
        getOrders(),
        getEstablishments()
      ])
      setOrders(ordersData || [])
      setEstablishments(establishmentsData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredPedidos = orders.filter(pedido => {
    const matchesSearch = pedido.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (pedido.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (pedido.order_code || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || 
                         (statusFilter === 'estorno' ? !!pedido.service_issue_customer_pix_key : pedido.status === statusFilter)
    const matchesEstabelecimento = estabelecimentoFilter === 'todos' || pedido.establishment_id === estabelecimentoFilter
    
    return matchesSearch && matchesStatus && matchesEstabelecimento
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock
      case 'preparing': return ChefHat
      case 'ready': return CheckCircle
      case 'delivered':
      case 'completed': return Truck
      case 'cancelled': return XCircle
      default: return ShoppingBag
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando pedidos...</span>
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

  const totalPedidos = orders.length
  const totalFaturamento = orders.reduce((acc, p) => acc + (p.total || 0), 0)
  const pedidosEntregues = orders.filter(p => p.status === 'delivered' || p.status === 'completed').length
  const pedidosCancelados = orders.filter(p => p.status === 'cancelled').length
  const pedidosEstorno = orders.filter(p => p.service_issue_customer_pix_key).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground">Acompanhe todos os pedidos do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card rounded-2xl border border-border/50 p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-primary">{totalPedidos}</p>
          <p className="text-sm text-muted-foreground">Total de Pedidos</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-success">{formatCurrency(totalFaturamento)}</p>
          <p className="text-sm text-muted-foreground">Faturamento</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-blue-500">{pedidosEntregues}</p>
          <p className="text-sm text-muted-foreground">Entregues</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-destructive">{pedidosCancelados}</p>
          <p className="text-sm text-muted-foreground">Cancelados</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 text-center shadow-card cursor-pointer hover:border-orange-300 transition-colors" onClick={() => setStatusFilter('estorno')}>
          <p className="text-2xl font-bold text-orange-500">{pedidosEstorno}</p>
          <p className="text-sm text-muted-foreground">Aguardando Estorno</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por código ou nome do cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            >
              <option value="todos">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="preparing">Preparando</option>
              <option value="ready">Pronto</option>
              <option value="delivered">Entregue</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
              <option value="estorno">Aguardando Estorno</option>
            </select>
            <select
              value={estabelecimentoFilter}
              onChange={(e) => setEstabelecimentoFilter(e.target.value)}
              className="px-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            >
              <option value="todos">Todos os Estabelecimentos</option>
              {establishments.map(est => (
                <option key={est.id} value={est.id}>{est.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Orders List */}
      <Card>
        <div className="space-y-4">
          {filteredPedidos.map((pedido) => {
            const estabelecimento = establishments.find(e => e.id === pedido.establishment_id)
            const StatusIcon = getStatusIcon(pedido.status || 'pending')
            
            return (
              <div key={pedido.id} className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      pedido.status === 'delivered' || pedido.status === 'completed' ? 'bg-success/10' :
                      pedido.status === 'preparing' ? 'bg-warning/10' :
                      pedido.status === 'ready' ? 'bg-purple-500/10' :
                      pedido.status === 'cancelled' ? 'bg-destructive/10' : 'bg-primary/10'
                    }`}>
                      <StatusIcon className={`w-5 h-5 ${
                        pedido.status === 'delivered' || pedido.status === 'completed' ? 'text-success' :
                        pedido.status === 'preparing' ? 'text-warning' :
                        pedido.status === 'ready' ? 'text-purple-500' :
                        pedido.status === 'cancelled' ? 'text-destructive' : 'text-primary'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-primary font-medium">
                          {pedido.order_code || pedido.id.slice(0, 8)}
                        </span>
                        <Badge variant={
                          pedido.status === 'delivered' || pedido.status === 'completed' ? 'success' :
                          pedido.status === 'preparing' ? 'warning' :
                          pedido.status === 'ready' ? 'purple' :
                          pedido.status === 'cancelled' ? 'danger' : 'primary'
                        }>
                          {pedido.status === 'pending' ? 'Pendente' :
                           pedido.status === 'preparing' ? 'Preparando' :
                           pedido.status === 'ready' ? 'Pronto' :
                           pedido.status === 'delivered' ? 'Entregue' :
                           pedido.status === 'completed' ? 'Concluído' :
                           pedido.status === 'cancelled' ? 'Cancelado' : pedido.status}
                        </Badge>
                        {pedido.payment_status && (
                          <Badge variant={
                            pedido.payment_status === 'approved' || pedido.payment_status === 'paid' ? 'success' :
                            pedido.payment_status === 'pending' ? 'warning' : 'default'
                          } className="text-xs">
                            {pedido.payment_status === 'approved' || pedido.payment_status === 'paid' ? 'Pago' :
                             pedido.payment_status === 'pending' ? 'Aguardando' : pedido.payment_status}
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium">{pedido.customer_name || 'Cliente não informado'}</p>
                      <p className="text-sm text-muted-foreground">{estabelecimento?.name || 'Estabelecimento não encontrado'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="text-left md:text-right">
                      <p className="text-lg font-bold text-primary">{formatCurrency(pedido.total || 0)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(pedido.created_at)}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Info adicional */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {pedido.payment_method && (
                      <span>Pagamento: <span className="text-foreground">{pedido.payment_method}</span></span>
                    )}
                    {pedido.customer_phone && (
                      <span>Telefone: <span className="text-foreground">{pedido.customer_phone}</span></span>
                    )}
                  </div>
                </div>

                {/* PIX Key para estorno */}
                {pedido.service_issue_customer_pix_key && (
                  <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">Estorno Solicitado</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <KeyRound className="w-4 h-4 text-orange-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Chave PIX do Cliente</p>
                        <p className="font-mono text-sm font-medium text-foreground break-all">{pedido.service_issue_customer_pix_key}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(pedido.service_issue_customer_pix_key!)
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {filteredPedidos.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Phone, 
  Mail,
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Edit,
  Trash2,
  Package,
  Users,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  User
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import KPICard from '@/components/dashboard/KPICard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate, formatDateTime, formatPhone } from '@/lib/utils'
import { getEstablishmentById, getOrders } from '@/lib/supabase'
import type { Establishment } from '@/integrations/supabase/types'

export default function ClienteDetalhes() {
  const { id } = useParams<{ id: string }>()
  const [cliente, setCliente] = useState<any>(null)
  const [pedidosCliente, setPedidosCliente] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCliente()
  }, [id])

  async function loadCliente() {
    try {
      setLoading(true)
      if (!id) return
      
      const [clienteData, ordersData] = await Promise.all([
        getEstablishmentById(id),
        getOrders(id)
      ])
      
      setCliente(clienteData)
      setPedidosCliente(ordersData || [])
    } catch (err: any) {
      console.error('Erro ao carregar cliente:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando detalhes...</span>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Estabelecimento não encontrado</h2>
        <Link to="/clientes">
          <Button variant="outline">Voltar para Estabelecimentos</Button>
        </Link>
      </div>
    )
  }

  // Calcular status do plano
  const dataAtual = new Date()
  const dataFim = cliente.data_plano_fim ? new Date(cliente.data_plano_fim) : null
  const planoAtivo = !dataFim || dataFim > dataAtual
  const diasRestantes = dataFim ? Math.ceil((dataFim.getTime() - dataAtual.getTime()) / (1000 * 60 * 60 * 24)) : null

  // Calcular ticket médio
  const ticketMedio = pedidosCliente.length > 0 
    ? pedidosCliente.reduce((sum: number, p: any) => sum + (p.total || 0), 0) / pedidosCliente.length
    : 0

  return (
    <div className="space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <Link to="/clientes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            {cliente.logo_url ? (
              <img src={cliente.logo_url} alt={cliente.name} className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{cliente.name}</h1>
              <p className="text-muted-foreground text-sm">{cliente.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status do Estabelecimento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge variant={
                cliente.status === 'ativo' ? 'success' :
                cliente.status === 'pendente' ? 'warning' : 'default'
              } className="text-base">
                {cliente.status === 'ativo' ? '✓ Ativo' : 
                 cliente.status === 'pendente' ? '⏳ Pendente' : '✗ Inativo'}
              </Badge>
            </div>
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Plano Atual</p>
              <p className="text-lg font-semibold capitalize">{cliente.plano}</p>
              {planoAtivo && diasRestantes !== null ? (
                <p className="text-xs text-success mt-1">✓ Ativo por {diasRestantes} dias</p>
              ) : (
                <p className="text-xs text-destructive mt-1">✗ Plano expirado</p>
              )}
            </div>
            <FileText className="w-5 h-5 text-primary" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Data de Cadastro</p>
              <p className="text-sm font-medium">{formatDate(cliente.created_at)}</p>
              <p className="text-xs text-muted-foreground mt-1">há {Math.ceil((Date.now() - new Date(cliente.created_at).getTime()) / (1000 * 60 * 60 * 24))} dias</p>
            </div>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados do Estabelecimento */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Dados do Estabelecimento
          </h3>
          
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium">{cliente.email}</p>
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Telefone</label>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium">{formatPhone(cliente.phone || '-')}</p>
              </div>
            </div>

            {/* CNPJ/CPF */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">
                {cliente.tipo_documento === 'cpf' ? 'CPF' : 'CNPJ'}
              </label>
              <p className="font-medium mt-1 font-mono">{cliente.documento}</p>
            </div>

            {/* Endereço */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Endereço</label>
              <div className="flex items-start gap-2 mt-1">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">{cliente.address || '-'}</p>
                  {cliente.city && (
                    <p className="text-muted-foreground text-xs">{cliente.city}, {cliente.state} {cliente.zip_code}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Dados do Responsável */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Responsável/Contato
          </h3>
          
          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Nome Responsável</label>
              <p className="font-medium mt-1">{cliente.responsavel_nome || 'Não informado'}</p>
            </div>

            {/* Telefone Responsável */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Telefone do Responsável</label>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium">{formatPhone(cliente.responsavel_telefone || '-')}</p>
              </div>
            </div>

            {/* Email Responsável */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Email do Responsável</label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium text-sm break-all">{cliente.responsavel_email || 'Não informado'}</p>
              </div>
            </div>

            {/* Último Acesso */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">Último Acesso</label>
              <p className="font-medium mt-1">{cliente.data_ultimo_acesso ? formatDateTime(cliente.data_ultimo_acesso) : 'Nunca acessou'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Dados Operacionais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Número de Funcionários"
          value={cliente.num_funcionarios?.toString() || '0'}
          icon={Users}
        />
        <KPICard
          title="Faturamento Total"
          value={formatCurrency(cliente.faturamento_total || 0)}
          icon={DollarSign}
        />
        <KPICard
          title="Média de Faturamento"
          value={formatCurrency(cliente.media_faturamento || 0)}
          icon={BarChart3}
        />
        <KPICard
          title="Total de Pedidos"
          value={pedidosCliente.length.toString()}
          icon={ShoppingCart}
        />
      </div>

      {/* Ticket Médio */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Análise de Pedidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-l-4 border-primary pl-4">
            <p className="text-sm text-muted-foreground">Ticket Médio</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(ticketMedio)}</p>
          </div>
          <div className="border-l-4 border-success pl-4">
            <p className="text-sm text-muted-foreground">Total de Pedidos</p>
            <p className="text-2xl font-bold mt-1">{pedidosCliente.length}</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-muted-foreground">Receita Total</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(
              pedidosCliente.reduce((sum: number, p: any) => sum + (p.total || 0), 0)
            )}</p>
          </div>
        </div>
      </Card>

      {/* Pedidos Recentes */}
      {pedidosCliente.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Últimos Pedidos
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium">ID do Pedido</th>
                  <th className="text-left py-2 px-3 font-medium">Cliente</th>
                  <th className="text-left py-2 px-3 font-medium">Valor</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {pedidosCliente.slice(0, 10).map((pedido: any) => (
                  <tr key={pedido.id} className="border-b border-border/50 hover:bg-muted/20 transition">
                    <td className="py-3 px-3 font-mono text-xs">{pedido.id?.slice(0, 8)}...</td>
                    <td className="py-3 px-3">{pedido.customer_name || 'Sem nome'}</td>
                    <td className="py-3 px-3 font-medium">{formatCurrency(pedido.total || 0)}</td>
                    <td className="py-3 px-3">
                      <Badge variant={pedido.status === 'completed' ? 'success' : 'default'}>
                        {pedido.status || 'Pendente'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground text-xs">{formatDate(pedido.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pedidosCliente.length > 10 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Mostrando 10 de {pedidosCliente.length} pedidos
            </p>
          )}
        </Card>
      )}

      {/* Ações */}
      <div className="flex gap-3">
        <Button variant="primary">
          <Edit className="w-4 h-4" />
          Editar Estabelecimento
        </Button>
        <Button variant="outline" className="text-destructive">
          <Trash2 className="w-4 h-4" />
          Remover
        </Button>
      </div>
    </div>
  )
}

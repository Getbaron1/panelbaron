import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Building2, 
  MapPin, 
  Phone,
  Eye,
  Edit,
  Trash2,
  Plus,
  Loader2,
  CreditCard,
  ExternalLink
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, formatPhone } from '@/lib/utils'
import { getEstablishments } from '@/lib/supabase'
import type { Establishment } from '@/integrations/supabase/types'

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEstablishments()
  }, [])

  async function loadEstablishments() {
    try {
      setLoading(true)
      const data = await getEstablishments()
      setEstablishments(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredClientes = establishments.filter(cliente => {
    const matchesSearch = cliente.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cliente.slug || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cliente.phone || '').includes(searchTerm)
    const matchesStatus = statusFilter === 'todos' || cliente.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando estabelecimentos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={loadEstablishments}>Tentar novamente</Button>
      </div>
    )
  }

  const activeCount = establishments.filter(c => c.status === 'active').length
  const pendingCount = establishments.filter(c => c.status === 'pending').length
  const inactiveCount = establishments.filter(c => c.status !== 'active' && c.status !== 'pending').length
  const mpConnectedCount = 0 // TODO: Adicionar campo ao banco

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estabelecimentos</h1>
          <p className="text-muted-foreground">Gerencie todos os estabelecimentos cadastrados</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4" />
          Novo Estabelecimento
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, slug ou telefone..."
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
              <option value="active">Ativo</option>
              <option value="pending">Pendente</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border/50 p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-primary">{establishments.length}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-success">{activeCount}</p>
          <p className="text-sm text-muted-foreground">Ativos</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          <p className="text-sm text-muted-foreground">Pendentes</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 text-center shadow-card">
          <p className="text-2xl font-bold text-blue-500">{mpConnectedCount}</p>
          <p className="text-sm text-muted-foreground">MercadoPago</p>
        </div>
      </div>

      {/* Clients Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estabelecimento</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Slug</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contato</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">MercadoPago</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cadastro</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {cliente.logo_url ? (
                        <img src={cliente.logo_url} alt={cliente.name} className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{cliente.name}</p>
                        <p className="text-xs text-muted-foreground">{cliente.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-primary bg-primary/10 px-2 py-1 rounded-lg">{cliente.slug}</code>
                      {cliente.slug && (
                        <a 
                          href={`https://baron-control.vercel.app/${cliente.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      {cliente.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{formatPhone(cliente.phone)}</span>
                        </div>
                      )}
                      {cliente.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground truncate max-w-[150px]">{cliente.address}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={
                      cliente.status === 'active' ? 'success' :
                      cliente.status === 'pending' ? 'warning' : 'default'
                    }>
                      {cliente.status === 'active' ? 'Ativo' : 
                       cliente.status === 'pending' ? 'Pendente' : cliente.status || 'Indefinido'}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={
                      cliente.status === 'active' ? 'success' :
                      cliente.status === 'pending' ? 'warning' : 'default'
                    }>
                      {cliente.status === 'active' ? 'Ativo' : 
                       cliente.status === 'pending' ? 'Pendente' : cliente.status || 'Indefinido'}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {formatDate(cliente.created_at)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/clientes/${cliente.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClientes.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum estabelecimento encontrado</p>
          </div>
        )}
      </Card>
    </div>
  )
}

import { useParams, Link, useNavigate } from 'react-router-dom'
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
  Loader2
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import KPICard from '@/components/dashboard/KPICard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getEstablishmentById, supabase } from '@/lib/supabase'
import type { Establishment } from '@/integrations/supabase/types'

export default function EstabelecimentoDetalhes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEstablishment()
  }, [id])

  async function loadEstablishment() {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const data = await getEstablishmentById(id)
      // if trial expired, block access by marking status as inactive
      if (data) {
        // If there is a trial end date, compute expiration
        if (data.trial_ends_at) {
          const trialDate = new Date(data.trial_ends_at)
          const now = new Date()
          if (trialDate < now && data.status === 'active') {
            try {
              await supabase
                .from('establishments')
                .update({ status: 'inactive', updated_at: new Date().toISOString() })
                .eq('id', id)

              // reflect change locally
              data.status = 'inactive'
            } catch (e) {
              console.error('Erro ao bloquear estabelecimento expirado:', e)
            }
          }
        }
      }

      setEstablishment(data)
    } catch (err: any) {
      console.error('Erro ao carregar estabelecimento:', err)
      setError(err.message || 'Erro ao carregar estabelecimento')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando estabelecimento...</span>
      </div>
    )
  }

  if (error || !establishment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Estabelecimento não encontrado</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => navigate('/')}>Voltar para Dashboard</Button>
      </div>
    )
  }

    // Computar dias restantes do período de teste
    let trialDaysRemaining: number | null = null
    let trialExpired = false
    if (establishment?.trial_ends_at) {
      const trialDate = new Date(establishment.trial_ends_at)
      const now = new Date()
      const ms = trialDate.getTime() - now.getTime()
      trialDaysRemaining = Math.max(Math.ceil(ms / (1000 * 60 * 60 * 24)), 0)
      trialExpired = trialDate < now
    }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{establishment.name}</h1>
            <p className="text-muted-foreground">Detalhes do estabelecimento</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="w-4 h-4" />
            Editar
          </Button>
          <Button variant="destructive">
            <Trash2 className="w-4 h-4" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Establishment Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              {establishment.logo_url ? (
                <img src={establishment.logo_url} alt={establishment.name} className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-primary" />
              )}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Slug</p>
                <p className="font-medium">{establishment.slug}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge variant={
                  establishment.status === 'active' ? 'success' :
                  establishment.status === 'pending' ? 'warning' :
                  establishment.status === 'inactive' ? 'danger' : 'default'
                }>
                  {establishment.status || 'pending'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium text-sm">{establishment.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                <p className="font-medium text-sm">{establishment.phone || '-'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="space-y-3">
          <KPICard
            title="Data de Criação"
            value={formatDate(establishment.created_at)}
            icon={Calendar}
          />
        </div>
      </div>

      {/* Address Info */}
      <Card title="Informações de Localização">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Endereço</p>
              <p className="font-medium">{establishment.address || 'Não informado'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Telefone</p>
              <p className="font-medium">{establishment.phone || 'Não informado'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-medium">{establishment.email || 'Não informado'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Descrição</p>
              <p className="font-medium">{establishment.description || 'Não informada'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Customization */}
      <Card title="Personalização">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-3">Cor Primária</p>
            <div className="flex items-center gap-3">
              <div 
                className="w-16 h-16 rounded-xl border-2 border-border"
                style={{ backgroundColor: establishment.primary_color || '#3B82F6' }}
              />
              <p className="font-mono text-sm">{establishment.primary_color || '#3B82F6'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-3">Cor Secundária</p>
            <div className="flex items-center gap-3">
              <div 
                className="w-16 h-16 rounded-xl border-2 border-border"
                style={{ backgroundColor: establishment.secondary_color || '#1E40AF' }}
              />
              <p className="font-mono text-sm">{establishment.secondary_color || '#1E40AF'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-3">Cor de Fundo</p>
            <div className="flex items-center gap-3">
              <div 
                className="w-16 h-16 rounded-xl border-2 border-border"
                style={{ backgroundColor: establishment.background_color || '#FFFFFF' }}
              />
              <p className="font-mono text-sm">{establishment.background_color || '#FFFFFF'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Período de Teste */}
      {establishment.trial_ends_at && (
        <Card title="Período de Teste">
          <div className={`flex items-center justify-between p-4 rounded-xl ${trialExpired ? 'bg-red-900/10 border border-red-700/20' : 'bg-warning/10 border border-warning/20'}`}>
            <div>
              <p className="font-medium">Teste até</p>
              <p className="text-sm text-muted-foreground">{formatDate(establishment.trial_ends_at)}</p>
              {!trialExpired && trialDaysRemaining !== null && (
                <p className="text-xs text-muted-foreground mt-1">Faltam <span className="font-bold">{trialDaysRemaining}</span> dia{trialDaysRemaining !== 1 ? 's' : ''}</p>
              )}
            </div>
            {trialExpired ? (
              <Badge variant="danger">Teste Expirado — Acesso Bloqueado</Badge>
            ) : (
              <Badge variant="warning">Em Período de Teste</Badge>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

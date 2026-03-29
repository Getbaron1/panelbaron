import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { mockEstabelecimentos, mockFaturamentoPorEstado } from '@/lib/mockData'
import { MapPin, Building2 } from 'lucide-react'

export default function Mapa() {
  // Agrupar estabelecimentos por estado
  const estabelecimentosPorEstado = mockEstabelecimentos.reduce((acc, est) => {
    if (!acc[est.estado]) {
      acc[est.estado] = []
    }
    acc[est.estado].push(est)
    return acc
  }, {} as Record<string, typeof mockEstabelecimentos>)

  const estados = Object.keys(estabelecimentosPorEstado).sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mapa de Estabelecimentos</h1>
        <p className="text-muted-foreground">Visualize a distribuição geográfica dos clientes</p>
      </div>

      {/* Stats por Estado */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {mockFaturamentoPorEstado.slice(0, 8).map((estado) => (
          <div key={estado.estado} className="bg-card rounded-2xl border border-border/50 p-4 text-center shadow-card">
            <p className="text-2xl font-bold text-primary">{estado.estado}</p>
            <p className="text-xs text-muted-foreground">
              {estabelecimentosPorEstado[estado.estado]?.length || 0} clientes
            </p>
          </div>
        ))}
      </div>

      {/* Mapa Placeholder */}
      <Card title="Distribuição Geográfica">
        <div className="h-96 bg-muted/30 rounded-xl flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            {/* SVG do Brasil simplificado */}
            <svg viewBox="0 0 500 500" className="w-full h-full">
              <path
                d="M150,100 L350,100 L400,200 L380,350 L250,450 L120,350 L100,200 Z"
                fill="hsl(0 84% 50%)"
                stroke="hsl(0 84% 50%)"
                strokeWidth="2"
              />
            </svg>
          </div>
          
          {/* Markers simulados */}
          <div className="absolute" style={{ top: '30%', left: '55%' }}>
            <div className="relative group">
              <div className="w-4 h-4 bg-primary rounded-full animate-ping absolute"></div>
              <div className="w-4 h-4 bg-primary rounded-full relative"></div>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border/50 px-2 py-1 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-card">
                SP - 3 clientes
              </div>
            </div>
          </div>
          
          <div className="absolute" style={{ top: '35%', left: '60%' }}>
            <div className="relative group">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping absolute"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full relative"></div>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border/50 px-2 py-1 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-card">
                RJ - 1 cliente
              </div>
            </div>
          </div>
          
          <div className="absolute" style={{ top: '40%', left: '50%' }}>
            <div className="relative group">
              <div className="w-3 h-3 bg-success rounded-full animate-ping absolute"></div>
              <div className="w-3 h-3 bg-success rounded-full relative"></div>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border/50 px-2 py-1 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-card">
                MG - 1 cliente
              </div>
            </div>
          </div>

          <div className="absolute" style={{ top: '55%', left: '45%' }}>
            <div className="relative group">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-ping absolute"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full relative"></div>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-border/50 px-2 py-1 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-card">
                RS - 1 cliente
              </div>
            </div>
          </div>

          <div className="text-center z-10">
            <MapPin className="w-16 h-16 text-primary/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Mapa interativo em desenvolvimento</p>
            <p className="text-sm text-muted-foreground mt-2">
              Integre com Google Maps ou Mapbox para visualização completa
            </p>
          </div>
        </div>
      </Card>

      {/* Lista por Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {estados.map((estado) => (
          <Card key={estado} title={`${estado} - ${estabelecimentosPorEstado[estado].length} estabelecimentos`}>
            <div className="space-y-3">
              {estabelecimentosPorEstado[estado].map((est: any) => (
                <div key={est.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{est.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{est.cidade}</p>
                  </div>
                  <Badge variant={est.status === 'ativo' ? 'success' : 'warning'}>
                    {est.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { 
  Search, 
  Package,
  TrendingUp,
  Building2,
  Loader2
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { getProducts, getEstablishments, getTopProducts } from '@/lib/supabase'
import type { Product, Establishment } from '@/integrations/supabase/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function Produtos() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todos')
  const [products, setProducts] = useState<Product[]>([])
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [topProductsData, setTopProductsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [productsData, establishmentsData, topProds] = await Promise.all([
        getProducts(),
        getEstablishments(),
        getTopProducts(10)
      ])
      setProducts(productsData || [])
      setEstablishments(establishmentsData || [])
      setTopProductsData(topProds || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando produtos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-destructive mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors">
          Tentar novamente
        </button>
      </div>
    )
  }

  const categorias = [...new Set(products.map(p => p.category_id).filter(Boolean))]

  const filteredProdutos = products.filter(produto => {
    const matchesSearch = produto.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategoria = categoriaFilter === 'todos' || produto.category_id === categoriaFilter
    return matchesSearch && matchesCategoria
  })

  const chartData = topProductsData.map(p => ({
    nome: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
    vendas: p.quantity || 0
  }))

  const totalProdutos = products.length
  const produtosAtivos = products.filter(p => p.available).length
  const estabelecimentosComProdutos = new Set(products.map(p => p.establishment_id)).size

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Produtos</h1>
        <p className="text-muted-foreground">Análise de produtos de todos os estabelecimentos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalProdutos}</p>
              <p className="text-sm text-muted-foreground">Total de Produtos</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{produtosAtivos}</p>
              <p className="text-sm text-muted-foreground">Produtos Ativos</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{topProductsData.reduce((acc, p) => acc + (p.quantity || 0), 0)}</p>
              <p className="text-sm text-muted-foreground">Total Vendidos</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <Building2 className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{estabelecimentosComProdutos}</p>
              <p className="text-sm text-muted-foreground">Estabelecimentos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <Card title="Top 10 Produtos Mais Vendidos">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis type="number" stroke="hsl(220 9% 46%)" />
              <YAxis type="category" dataKey="nome" stroke="hsl(220 9% 46%)" width={120} tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(0 0% 100%)', 
                  border: '1px solid hsl(220 13% 91%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number) => [value.toLocaleString(), 'Vendas']}
              />
              <Bar dataKey="vendas" fill="hsl(0 84% 50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
          </div>
          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="px-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
          >
            <option value="todos">Todas as Categorias</option>
            {categorias.filter(cat => cat !== null).map(cat => (
              <option key={cat} value={cat || ''}>{cat}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProdutos.map((produto) => {
          const estabelecimento = establishments.find(e => e.id === produto.establishment_id)
          return (
            <Card key={produto.id}>
              <div className="flex items-start gap-4">
                {produto.image_url ? (
                  <img 
                    src={produto.image_url} 
                    alt={produto.name} 
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{produto.name}</h3>
                  <p className="text-sm text-muted-foreground">{estabelecimento?.name || 'N/A'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={produto.available ? 'success' : 'danger'}>
                      {produto.available ? 'Disponível' : 'Indisponível'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Preço</p>
                  <p className="font-semibold text-primary">{formatCurrency(produto.price || 0)}</p>
                </div>
                {produto.description && (
                  <div className="text-right max-w-[150px]">
                    <p className="text-xs text-muted-foreground truncate">{produto.description}</p>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {filteredProdutos.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        </Card>
      )}
    </div>
  )
}

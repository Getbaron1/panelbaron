// src/components/comercial/MonthlyTargetBar.tsx
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TrendingUp, Edit2, Save, X, Users, Target } from 'lucide-react'

interface MonthlyTarget {
  id: string
  mes_ano: string
  meta_clientes: number
  descricao?: string
  ativo: boolean
}

export function MonthlyTargetBar() {
  const [meta, setMeta] = useState<MonthlyTarget | null>(null)
  const [clientesFechados, setClientesFechados] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [newTarget, setNewTarget] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('')

  // Verificar role do usuário para permitir edição
  useEffect(() => {
    const userData = localStorage.getItem('baron_admin_user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.role || '')
      } catch (e) {
        console.error('Erro ao ler role do usuário')
      }
    }
  }, [])

  // Apenas super_admin e admin podem editar a meta
  const canEditTarget = userRole === 'super_admin' || userRole === 'admin'

  useEffect(() => {
    carregarDados()
    const interval = setInterval(carregarDados, 30000)
    return () => clearInterval(interval)
  }, [])

  async function carregarDados() {
    try {
      setLoading(true)
      
      // Buscar meta do mês atual
      const mesAtual = new Date().toISOString().slice(0, 7) + '-01'
      
      const { data: metaData } = await supabase
        .from('monthly_targets')
        .select('*')
        .gte('mes_ano', mesAtual)
        .order('mes_ano', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (metaData) {
        setMeta({
          id: metaData.id,
          mes_ano: metaData.mes_ano,
          meta_clientes: metaData.meta_clientes ?? 10,
          descricao: metaData.descricao,
          ativo: metaData.ativo
        })
        setNewTarget((metaData.meta_clientes ?? 10).toString())
      } else {
        // Meta padrão se não existir
        setMeta({
          id: '',
          mes_ano: mesAtual,
          meta_clientes: 10,
          ativo: true
        })
        setNewTarget('10')
      }

      // Contar leads convertidos no mês atual
      const inicioMes = new Date()
      inicioMes.setDate(1)
      inicioMes.setHours(0, 0, 0, 0)
      
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'convertido')
        .gte('updated_at', inicioMes.toISOString())

      setClientesFechados(count || 0)
      setError(null)
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  async function atualizarMeta() {
    if (!newTarget || isNaN(Number(newTarget))) return

    try {
      const mesAtual = new Date().toISOString().slice(0, 7) + '-01'
      
      if (meta?.id) {
        // Atualizar meta existente
        const { error: err } = await supabase
          .from('monthly_targets')
          .update({ meta_clientes: Number(newTarget) })
          .eq('id', meta.id)

        if (err) throw err
      } else {
        // Criar nova meta
        const { error: err } = await supabase
          .from('monthly_targets')
          .insert({
            mes_ano: mesAtual,
            meta_clientes: Number(newTarget),
            ativo: true
          })

        if (err) throw err
      }

      setIsEditing(false)
      await carregarDados()
    } catch (err) {
      console.error('Erro ao atualizar meta:', err)
      setError('Erro ao atualizar meta')
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700 p-4">
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin">
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </Card>
    )
  }

  const metaClientes = meta?.meta_clientes || 10
  const percentual = Math.min((clientesFechados / metaClientes) * 100, 100)
  const faltam = Math.max(metaClientes - clientesFechados, 0)
  
  const now = new Date();
  const mesAtual = now.toLocaleDateString('pt-BR', { month: 'long' });
  const anoAtual = now.getFullYear();
  const diaAtual = now.getDate();
  // Contagem de dias do mês
  const diasNoMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  // Nome da meta: META FEVEREIRO
  const nomeMeta = `🔥 META ${mesAtual.toUpperCase()} 🔥`;

  // Cores baseadas no progresso
  let barColor = 'from-red-500 to-orange-500'
  let textColor = 'text-red-400'
  if (percentual >= 50) {
    barColor = 'from-yellow-500 to-amber-500'
    textColor = 'text-yellow-400'
  }
  if (percentual >= 75) {
    barColor = 'from-blue-500 to-cyan-500'
    textColor = 'text-blue-400'
  }
  if (percentual >= 100) {
    barColor = 'from-green-500 to-emerald-500'
    textColor = 'text-green-400'
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-4 md:p-6">
      {error && (
        <div className="mb-3 p-2 bg-red-900/50 text-red-300 rounded-lg text-xs">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Header estilizado centralizado */}
        <div className="flex flex-col items-center justify-center gap-1 mb-2">
          <div className="flex items-center justify-center gap-2">
            <Target className="w-6 h-6 text-emerald-400 drop-shadow-glow animate-pulse" />
            <h3
              className="text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-cyan-400 font-extrabold text-xl md:text-2xl tracking-wide drop-shadow-lg uppercase"
              style={{ letterSpacing: '0.08em' }}
            >
              {nomeMeta}
            </h3>
          </div>
          <span className="block text-xs md:text-sm text-gray-300 font-medium tracking-wide mt-1 bg-slate-800/60 px-3 py-1 rounded-full shadow-inner">
            Dia <span className="text-emerald-400 font-bold">{diaAtual}</span> de <span className="text-blue-400 font-bold">{diasNoMes}</span> | <span className="text-cyan-300 font-bold">{anoAtual}</span>
          </span>
        </div>

        {/* Cards de Info - Grid Responsivo */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {/* Meta */}
          <div className="bg-slate-700/50 rounded-lg p-2 md:p-3 text-center">
            <p className="text-[10px] md:text-xs text-gray-400 mb-1">🎯 Meta</p>
            {isEditing ? (
              <input
                type="number"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className="w-full h-8 text-center text-lg font-bold bg-slate-600 text-white border border-slate-500 rounded"
                min="1"
              />
            ) : (
              <p className="text-xl md:text-2xl font-bold text-white">{metaClientes}</p>
            )}
          </div>

          {/* Fechados */}
          <div className="bg-slate-700/50 rounded-lg p-2 md:p-3 text-center">
            <p className="text-[10px] md:text-xs text-gray-400 mb-1">✅ Fechados</p>
            <p className="text-xl md:text-2xl font-bold text-emerald-400">{clientesFechados}</p>
          </div>

          {/* Faltam */}
          <div className="bg-slate-700/50 rounded-lg p-2 md:p-3 text-center">
            <p className="text-[10px] md:text-xs text-gray-400 mb-1">⏳ Faltam</p>
            <p className={`text-xl md:text-2xl font-bold ${faltam === 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
              {faltam === 0 ? '🎉' : faltam}
            </p>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Progresso</span>
            <span className={`text-lg md:text-xl font-bold ${textColor}`}>
              {percentual.toFixed(0)}%
            </span>
          </div>

          <div className="w-full bg-slate-700 rounded-full h-6 md:h-8 overflow-hidden shadow-lg border border-slate-600">
            <div
              className={`h-full bg-gradient-to-r ${barColor} flex items-center justify-center transition-all duration-700 ease-out relative`}
              style={{
                width: `${percentual}%`,
                minWidth: percentual > 0 ? '30px' : '0px'
              }}
            >
              {/* Brilho animado */}
              {percentual > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              )}

              {/* Texto dentro da barra */}
              {percentual >= 20 && (
                <span className="relative text-white font-bold text-xs md:text-sm drop-shadow">
                  {clientesFechados}/{metaClientes}
                </span>
              )}
            </div>
          </div>

          {/* Texto abaixo da barra em mobile */}
          {percentual < 20 && (
            <p className="text-center text-xs text-gray-400">
              {clientesFechados} de {metaClientes} clientes
            </p>
          )}
        </div>

        {/* Botões de Ação - Responsivos */}
        {canEditTarget && (
          <div className="flex gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex-1 text-xs md:text-sm py-2"
              >
                <Edit2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Editar Meta
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={atualizarMeta}
                  className="flex-1 text-xs md:text-sm py-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setNewTarget(metaClientes.toString())
                  }}
                  className="flex-1 text-xs md:text-sm py-2"
                >
                  <X className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Cancelar
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export default MonthlyTargetBar

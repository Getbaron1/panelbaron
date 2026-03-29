import { createClient } from '@supabase/supabase-js'
import type { Database, Establishment } from './types'
import { fetchAdminEstablishmentById, fetchAdminEstablishments, fetchAdminOrders } from '@/lib/adminDataApi'

// Usando variáveis de ambiente do Netlify ou fallback para as chaves fornecidas
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hyuxedgiahkynvozswca.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5dXhlZGdpYWhreW52b3pzd2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NDYxMDcsImV4cCI6MjA5MDMyMjEwN30.nBuy9_ob3w4rpxFEPqCOFL1nkscEB18OPRofAT-dGs4'
const SAFE_SUPABASE_URL = SUPABASE_URL
const SAFE_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY

export const supabase = createClient<any>(SAFE_SUPABASE_URL, SAFE_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Funções de API para o Painel Admin

// ==================== ESTABLISHMENTS ====================

export async function getEstablishments() {
  try {
    const apiData = await fetchAdminEstablishments()
    if (apiData.length > 0) return apiData
  } catch (apiError) {
    console.warn('Admin API establishments unavailable, fallback to Supabase:', apiError)
  }

  const { data, error } = await supabase
    .from('establishments')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Establishment[] || []
}

export async function getEstablishmentById(id: string) {
  try {
    const apiData = await fetchAdminEstablishmentById(id)
    if (apiData) return apiData
  } catch (apiError) {
    console.warn('Admin API establishment unavailable, fallback to Supabase:', apiError)
  }

  const { data, error } = await supabase
    .from('establishments')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function getEstablishmentBySlug(slug: string) {
  const { data, error } = await supabase
    .from('establishments')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error) throw error
  return data
}

export async function updateEstablishment(id: string, updates: Partial<Database['public']['Tables']['establishments']['Update']>) {
  const { data, error } = await supabase
    .from('establishments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteEstablishment(id: string) {
  const { error } = await supabase
    .from('establishments')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ==================== ORDERS ====================

export async function getOrders(establishmentId?: string) {
  try {
    const apiData = await fetchAdminOrders(establishmentId)
    if (apiData.length > 0 || establishmentId) return apiData
  } catch (apiError) {
    console.warn('Admin API orders unavailable, fallback to Supabase:', apiError)
  }

  let query = supabase
    .from('orders')
    .select(`
      *,
      establishment:establishments(id, name, slug, logo_url)
    `)
    .order('created_at', { ascending: false })
  
  if (establishmentId) {
    query = query.eq('establishment_id', establishmentId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

export async function getOrderById(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*),
      establishment:establishments(id, name, slug, logo_url, phone, email)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function getOrderItems(orderId: string) {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
  
  if (error) throw error
  return data
}

export async function updateOrderStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ==================== PRODUCTS ====================

export async function getProducts(establishmentId?: string) {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, icon),
      establishment:establishments(id, name, slug)
    `)
    .order('created_at', { ascending: false })
  
  if (establishmentId) {
    query = query.eq('establishment_id', establishmentId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, icon),
      establishment:establishments(id, name, slug, logo_url)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function updateProduct(id: string, updates: Partial<Database['public']['Tables']['products']['Update']>) {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ==================== CATEGORIES ====================

export async function getCategories(establishmentId?: string) {
  let query = supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  
  if (establishmentId) {
    query = query.eq('establishment_id', establishmentId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

// ==================== ESTATÍSTICAS / DASHBOARD ====================

export async function getDashboardStats() {
  // Buscar todos os dados necessários
  const [establishmentsRes, ordersRes, productsRes] = await Promise.all([
    supabase.from('establishments').select('id, status, created_at'),
    supabase.from('orders').select('id, total, status, created_at, payment_status, platform_fee'),
    supabase.from('products').select('id, establishment_id, available')
  ])

  if (establishmentsRes.error) throw establishmentsRes.error
  if (ordersRes.error) throw ordersRes.error
  if (productsRes.error) throw productsRes.error

  const establishments = establishmentsRes.data || []
  const orders = ordersRes.data || []
  const products = productsRes.data || []

  // Calcular estatísticas
  const totalEstablishments = establishments.length
  const activeEstablishments = establishments.filter(e => e.status === 'active').length
  const mercadoPagoConnected = 0 // TODO: Adicionar campo ao banco
  
  // Estabelecimentos novos este mês
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  const newThisMonth = establishments.filter(e => new Date(e.created_at) >= thisMonth).length

  // Pedidos
  const totalOrders = orders.length
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  
  // Pedidos de hoje
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const ordersToday = orders.filter(o => new Date(o.created_at) >= today).length

  // Faturamento
  const totalRevenue = orders
    .filter(o => o.payment_status === 'approved' || o.payment_status === 'paid')
    .reduce((acc, o) => acc + (o.total || 0), 0)
  
  const platformFees = orders
    .filter(o => o.payment_status === 'approved' || o.payment_status === 'paid')
    .reduce((acc, o) => acc + (o.platform_fee || 0), 0)

  // Faturamento do mês
  const revenueThisMonth = orders
    .filter(o => {
      const orderDate = new Date(o.created_at)
      return orderDate >= thisMonth && (o.payment_status === 'approved' || o.payment_status === 'paid')
    })
    .reduce((acc, o) => acc + (o.total || 0), 0)

  // Ticket médio
  const ticketMedio = completedOrders > 0 ? totalRevenue / completedOrders : 0

  // Produtos
  const totalProducts = products.length
  const availableProducts = products.filter(p => p.available).length

  return {
    totalEstablishments,
    activeEstablishments,
    mercadoPagoConnected,
    newThisMonth,
    totalOrders,
    completedOrders,
    pendingOrders,
    ordersToday,
    totalRevenue,
    platformFees,
    revenueThisMonth,
    ticketMedio,
    totalProducts,
    availableProducts
  }
}

export async function getRevenueByPeriod(days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('orders')
    .select('created_at, total, payment_status')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })
  
  if (error) throw error
  
  // Agrupar por dia
  const revenueByDay: Record<string, number> = {}
  
  data?.forEach(order => {
    if (order.payment_status === 'approved' || order.payment_status === 'paid') {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      revenueByDay[date] = (revenueByDay[date] || 0) + (order.total || 0)
    }
  })
  
  return Object.entries(revenueByDay).map(([date, value]) => ({
    date,
    value
  }))
}

export async function getOrdersByStatus() {
  const { data, error } = await supabase
    .from('orders')
    .select('status')
  
  if (error) throw error
  
  const statusCount: Record<string, number> = {}
  data?.forEach(order => {
    const status = order.status || 'unknown'
    statusCount[status] = (statusCount[status] || 0) + 1
  })
  
  return Object.entries(statusCount).map(([status, count]) => ({
    status,
    count
  }))
}

export async function getTopProducts(limit: number = 10) {
  // Buscar itens de pedido agrupados por produto
  const { data: orderItems, error } = await supabase
    .from('order_items')
    .select(`
      product_id,
      product_name,
      quantity,
      total_price
    `)
  
  if (error) throw error
  
  // Agrupar vendas por produto
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
  
  orderItems?.forEach(item => {
    const key = item.product_id || item.product_name
    if (!productSales[key]) {
      productSales[key] = { name: item.product_name, quantity: 0, revenue: 0 }
    }
    productSales[key].quantity += item.quantity
    productSales[key].revenue += item.total_price
  })
  
  // Ordenar por quantidade vendida
  return Object.entries(productSales)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)
}

export async function getEstablishmentStats(establishmentId: string) {
  const [ordersRes, productsRes, categoriesRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, status, payment_status, created_at')
      .eq('establishment_id', establishmentId),
    supabase
      .from('products')
      .select('id, available')
      .eq('establishment_id', establishmentId),
    supabase
      .from('categories')
      .select('id')
      .eq('establishment_id', establishmentId)
  ])

  if (ordersRes.error) throw ordersRes.error
  if (productsRes.error) throw productsRes.error
  if (categoriesRes.error) throw categoriesRes.error

  const orders = ordersRes.data || []
  const products = productsRes.data || []
  const categories = categoriesRes.data || []

  const totalOrders = orders.length
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length
  const totalRevenue = orders
    .filter(o => o.payment_status === 'approved' || o.payment_status === 'paid')
    .reduce((acc, o) => acc + (o.total || 0), 0)
  const ticketMedio = completedOrders > 0 ? totalRevenue / completedOrders : 0

  return {
    totalOrders,
    completedOrders,
    totalRevenue,
    ticketMedio,
    totalProducts: products.length,
    availableProducts: products.filter(p => p.available).length,
    totalCategories: categories.length
  }
}

// Obter estatísticas de TODOS os estabelecimentos para ranking
export async function getAllEstablishmentsStats() {
  // Buscar todos os estabelecimentos
  const { data: establishments, error: estError } = await supabase
    .from('establishments')
    .select('id, name, slug, logo_url, status')
  
  if (estError) throw estError

  // Buscar todos os pedidos
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('establishment_id, total, status, payment_status')
  
  if (ordersError) throw ordersError

  // Calcular estatísticas por estabelecimento
  const statsMap: Record<string, { totalOrders: number; totalRevenue: number }> = {}
  
  orders?.forEach(order => {
    if (!statsMap[order.establishment_id]) {
      statsMap[order.establishment_id] = { totalOrders: 0, totalRevenue: 0 }
    }
    statsMap[order.establishment_id].totalOrders += 1
    if (order.payment_status === 'approved' || order.payment_status === 'paid') {
      statsMap[order.establishment_id].totalRevenue += (order.total || 0)
    }
  })

  // Combinar dados
  return (establishments || []).map(est => ({
    ...est,
    totalOrders: statsMap[est.id]?.totalOrders || 0,
    totalRevenue: statsMap[est.id]?.totalRevenue || 0
  }))
}

// ==================== WITHDRAWALS (SAQUES) ====================

export async function getWithdrawals(establishmentId?: string) {
  try {
    let query: any = supabase
      .from('withdrawals' as any)
      .select('*')
      .order('requested_at', { ascending: false })
    
    if (establishmentId) {
      query = query.eq('establishment_id', establishmentId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return (data || []) as any[]
  } catch (err) {
    console.warn('Withdrawals table not ready yet:', err)
    return []
  }
}

export async function getWithdrawalById(id: string) {
  try {
    const { data, error } = await supabase
      .from('withdrawals' as any)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as any
  } catch (err) {
    console.warn('Withdrawal not found:', err)
    return null
  }
}

export async function createWithdrawal(withdrawal: any) {
  try {
    const { data, error } = await supabase
      .from('withdrawals' as any)
      .insert([withdrawal])
      .select()
      .single()
    
    if (error) throw error
    
    if (data) {
      await createAuditLog({
        withdrawal_id: (data as any).id,
        user_id: null,
        user_name: 'Sistema',
        action: 'Saque criado automaticamente',
        establishment_id: (data as any).id,
        details: { method: 'automatic' }
      })
    }
    
    return data as any
  } catch (err) {
    console.warn('Error creating withdrawal:', err)
    return null
  }
}

export async function updateWithdrawalStatus(
  id: string,
  status: 'pending' | 'paid' | 'rejected',
  proof_url?: string
) {
  try {
    const updates: any = { status, updated_at: new Date().toISOString() }
    
    if (proof_url) {
      updates.proof_url = proof_url
    }
    
    if (status === 'paid') {
      updates.paid_at = new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('withdrawals' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    if (data) {
      const actionMap: any = {
        paid: 'Saque confirmado como pago',
        rejected: 'Saque rejeitado',
        pending: 'Saque retornou para pendente'
      }
      
      await createAuditLog({
        withdrawal_id: (data as any).id,
        user_id: null,
        user_name: 'Admin',
        action: actionMap[status],
        establishment_id: (data as any).id,
        details: { proof_url, previous_status: 'pending' }
      })
    }
    
    return data as any
  } catch (err) {
    console.warn('Error updating withdrawal:', err)
    return null
  }
}

export async function deleteWithdrawal(id: string) {
  try {
    const { error } = await supabase
      .from('withdrawals' as any)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  } catch (err) {
    console.warn('Error deleting withdrawal:', err)
  }
}

// ==================== AUDIT LOGS ====================

export async function createAuditLog(log: any) {
  try {
    const { data, error } = await supabase
      .from('audit_logs' as any)
      .insert([{
        withdrawal_id: log.withdrawal_id,
        user_id: log.user_id,
        user_name: log.user_name,
        action: log.action,
        establishment_id: log.establishment_id,
        details: log.details || {}
      }])
      .select()
      .single()
    
    if (error) throw error
    return data as any
  } catch (err) {
    console.warn('Error creating audit log:', err)
    return null
  }
}

export async function getAuditLogsByWithdrawal(withdrawalId: string) {
  try {
    const { data, error } = await supabase
      .from('audit_logs' as any)
      .select('*')
      .eq('withdrawal_id', withdrawalId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []) as any[]
  } catch (err) {
    console.warn('Error fetching audit logs:', err)
    return []
  }
}

// ==================== FILE UPLOADS ====================

export async function uploadProofFile(
  file: File,
  withdrawalId: string,
  establishmentId: string
) {
  try {
    const fileName = `${establishmentId}/${withdrawalId}/${Date.now()}_${file.name}`
    
    const { data, error } = await supabase.storage
      .from('withdrawal_proofs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) throw error
    
    const { data: urlData } = supabase.storage
      .from('withdrawal_proofs')
      .getPublicUrl(fileName)
    
    return urlData?.publicUrl || ''
  } catch (err) {
    console.warn('Error uploading proof file:', err)
    return ''
  }
}

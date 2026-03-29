import type { Database, Establishment } from '@/integrations/supabase/types'
import {
  supabase,
  getEstablishments as _getEstablishments,
  getEstablishmentById as _getEstablishmentById,
  getEstablishmentBySlug,
  updateEstablishment,
  deleteEstablishment,
  getOrders as _getOrders,
  getOrderById,
  getOrderItems,
  updateOrderStatus,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories,
  getOrdersByStatus,
  getWithdrawals,
  getWithdrawalById,
  createWithdrawal,
  updateWithdrawalStatus,
  deleteWithdrawal,
  createAuditLog,
  getAuditLogsByWithdrawal,
  uploadProofFile,
} from '@/integrations/supabase/client'

// Re-exportamos a instância ÚNICA do supabase (evita Multiple GoTrueClient)
export { supabase }

// Delegates diretos para o client.ts (que usa Supabase)
export async function getEstablishments() {
  return _getEstablishments()
}

export async function getEstablishmentById(id: string) {
  return _getEstablishmentById(id)
}

export async function getOrders(establishmentId?: string) {
  return _getOrders(establishmentId)
}

export async function getDashboardStats() {
  const [establishments, orders] = await Promise.all([
    getEstablishments(),
    getOrders(),
  ])

  const totalEstablishments = establishments.length
  const activeEstablishments = establishments.filter(e => e.status === 'active').length
  const mercadoPagoConnected = 0

  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  const newThisMonth = establishments.filter(e => new Date(e.created_at) >= thisMonth).length

  const totalOrders = orders.length
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length
  const pendingOrders = orders.filter(o => o.status === 'pending').length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const ordersToday = orders.filter(o => new Date(o.created_at) >= today).length

  const totalRevenue = orders
    .filter(o => o.payment_status === 'approved' || o.payment_status === 'paid')
    .reduce((acc, o) => acc + (o.total || 0), 0)

  const platformFees = orders
    .filter(o => o.payment_status === 'approved' || o.payment_status === 'paid')
    .reduce((acc, o) => acc + (o.platform_fee || 0), 0)

  const revenueThisMonth = orders
    .filter(o => {
      const orderDate = new Date(o.created_at)
      return orderDate >= thisMonth && (o.payment_status === 'approved' || o.payment_status === 'paid')
    })
    .reduce((acc, o) => acc + (o.total || 0), 0)

  const ticketMedio = completedOrders > 0 ? totalRevenue / completedOrders : 0

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
    totalProducts: 0,
    availableProducts: 0
  }
}

export async function getRevenueByPeriod(days: number = 30) {
  const orders = await getOrders()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const revenueByDay: Record<string, number> = {}

  orders.forEach(order => {
    if (new Date(order.created_at) < startDate) return
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

export async function getTopProducts(limit: number = 10) {
  try {
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        product_id,
        product_name,
        quantity,
        total_price
      `)

    if (error) throw error

    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}

    orderItems?.forEach(item => {
      const key = item.product_id || item.product_name
      if (!productSales[key]) {
        productSales[key] = { name: item.product_name, quantity: 0, revenue: 0 }
      }
      productSales[key].quantity += item.quantity
      productSales[key].revenue += item.total_price
    })

    return Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit)
  } catch {
    return []
  }
}

export async function getEstablishmentStats(establishmentId: string) {
  const [orders, establishments] = await Promise.all([
    getOrders(establishmentId),
    getEstablishments(),
  ])

  const currentEstablishment = establishments.find(item => item.id === establishmentId)
  const totalOrders = orders.length
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length
  const totalRevenue = orders
    .filter(o => o.payment_status === 'approved' || o.payment_status === 'paid')
    .reduce((acc, o) => acc + (o.total || 0), 0)
  const ticketMedio = completedOrders > 0 ? totalRevenue / completedOrders : 0

  return {
    establishment: currentEstablishment || null,
    totalOrders,
    completedOrders,
    totalRevenue,
    ticketMedio,
    totalProducts: 0,
    availableProducts: 0,
    totalCategories: 0
  }
}

export async function getAllEstablishmentsStats() {
  const [establishments, orders] = await Promise.all([
    getEstablishments(),
    getOrders(),
  ])

  const statsMap: Record<string, { totalOrders: number; totalRevenue: number }> = {}

  orders.forEach(order => {
    if (!statsMap[order.establishment_id]) {
      statsMap[order.establishment_id] = { totalOrders: 0, totalRevenue: 0 }
    }
    statsMap[order.establishment_id].totalOrders += 1
    if (order.payment_status === 'approved' || order.payment_status === 'paid') {
      statsMap[order.establishment_id].totalRevenue += (order.total || 0)
    }
  })

  return establishments.map(est => ({
    ...est,
    totalOrders: statsMap[est.id]?.totalOrders || 0,
    totalRevenue: statsMap[est.id]?.totalRevenue || 0
  }))
}

export {
  getEstablishmentBySlug,
  updateEstablishment,
  deleteEstablishment,
  getOrderById,
  getOrderItems,
  updateOrderStatus,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories,
  getOrdersByStatus,
  getWithdrawals,
  getWithdrawalById,
  createWithdrawal,
  updateWithdrawalStatus,
  deleteWithdrawal,
  createAuditLog,
  getAuditLogsByWithdrawal,
  uploadProofFile,
}

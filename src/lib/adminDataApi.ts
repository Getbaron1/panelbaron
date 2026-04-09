import type { Establishment, Product } from '@/integrations/supabase/types'

// Em produção (Netlify), usar o proxy /api para evitar CORS.
// Em dev local, usar URL direta da API.
const ADMIN_API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || 'https://api.getbaron.com.br/v1'
const API_TOKEN = import.meta.env.VITE_ADMIN_API_TOKEN || ''
const DEFAULT_ESTABLISHMENT_PATHS = ['/admin/establishments']
const DEFAULT_ORDER_PATHS = ['/orders']
const DEFAULT_ORDER_ISSUE_PATHS = ['/order-issues']
const DEFAULT_PRODUCT_PATHS = ['/catalog/products']
const DEFAULT_TOP_PRODUCTS_PATHS: string[] = []

function readPathsFromEnv(envValue: string | undefined, fallback: string[]) {
  const paths = (envValue || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  return paths.length > 0 ? paths : fallback
}

const ESTABLISHMENT_PATHS = readPathsFromEnv(import.meta.env.VITE_ADMIN_ESTABLISHMENTS_PATHS, DEFAULT_ESTABLISHMENT_PATHS)
const ORDER_PATHS = readPathsFromEnv(import.meta.env.VITE_ADMIN_ORDERS_PATHS, DEFAULT_ORDER_PATHS)
const ORDER_ISSUE_PATHS = readPathsFromEnv(import.meta.env.VITE_ADMIN_ORDER_ISSUES_PATHS, DEFAULT_ORDER_ISSUE_PATHS)
const PRODUCT_PATHS = readPathsFromEnv(import.meta.env.VITE_ADMIN_PRODUCTS_PATHS, DEFAULT_PRODUCT_PATHS)
const TOP_PRODUCTS_PATHS = readPathsFromEnv(import.meta.env.VITE_ADMIN_TOP_PRODUCTS_PATHS, DEFAULT_TOP_PRODUCTS_PATHS)

type JsonRecord = Record<string, any>

export interface AdminOrder {
  id: string
  establishment_id: string
  customer_id: string | null
  customer_name: string | null
  customer_phone: string | null
  order_code: string | null
  payment_method: string | null
  payment_status: string | null
  platform_fee: number | null
  service_fee: number | null
  service_issue_customer_pix_key: string | null
  status: string | null
  subtotal: number
  total: number
  notes: string | null
  mercadopago_payment_id: string | null
  created_at: string
  updated_at: string
  establishment?: Pick<Establishment, 'id' | 'name' | 'slug' | 'logo_url'> | null
}

export interface AdminTopProduct {
  id: string
  name: string
  quantity: number
  revenue: number
}

export interface AdminWithdrawal {
  id: string
  establishment_id: string
  establishment?: { id: string; name: string } | null
  amount: number
  requested_amount?: number
  pix_key?: string | null
  requested_at: string
  paid_at?: string | null
  status: 'pending' | 'paid' | 'rejected'
  proof_url?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface AdminRefund {
  id: string
  order_id: string
  establishment_id: string
  establishment?: { id: string; name: string } | null
  amount: number
  reason: string | null
  status: string
  customer_name: string | null
  customer_phone: string | null
  pix_key: string | null
  proof_url?: string | null
  created_at: string
  updated_at: string
}

function extractRefundProofUrl(notes: string | null | undefined) {
  const match = String(notes || '').match(/Comprovante de estorno:\s*(https?:\/\/\S+)/i)
  return match?.[1] || null
}

function normalizeRefundFromOrder(raw: AdminOrder): AdminRefund | null {
  if (!raw.id || !raw.establishment_id || !raw.service_issue_customer_pix_key) {
    return null
  }

  const proofUrl = extractRefundProofUrl(raw.notes)

  return {
    id: `order-issue-${raw.id}`,
    order_id: raw.id,
    establishment_id: raw.establishment_id,
    establishment: raw.establishment
      ? {
          id: raw.establishment.id,
          name: raw.establishment.name,
        }
      : null,
    amount: toNumber(raw.total ?? raw.subtotal, 0),
    reason: raw.notes || 'Solicitacao de estorno registrada no pedido',
    status: proofUrl ? 'completed' : 'requested',
    customer_name: raw.customer_name || null,
    customer_phone: raw.customer_phone || null,
    pix_key: raw.service_issue_customer_pix_key,
    proof_url: proofUrl,
    created_at: raw.updated_at || raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || raw.created_at || new Date().toISOString(),
  }
}

async function requestJson(path: string, search?: Record<string, string | number | undefined>, options?: { method?: string; body?: any }) {
  const cleanBase = ADMIN_API_BASE_URL.replace(/\/+$/, '')
  const cleanPath = path.replace(/^\/+/, '').replace(/\/+$/, '')
  const rawUrl = `${cleanBase}/${cleanPath}`
  const url = new URL(rawUrl)

  Object.entries(search || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  // Evitar charset com application/json
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`
  }
  
  try {
    const { supabase } = await import('@/integrations/supabase/client')
    const { data: { session } } = await supabase.auth.getSession()
    if (!API_TOKEN && session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
  } catch (e) {}
  
  const fetchOptions: RequestInit = {
    method: options?.method || 'GET',
    headers,
  }

  if (options?.body) {
    if (typeof options.body === 'object') {
      fetchOptions.body = JSON.stringify(options.body)
      headers['Content-Type'] = 'application/json; charset=utf-8'
    } else {
      fetchOptions.body = options.body
    }
  }

  const response = await fetch(url.toString(), fetchOptions)

  if (!response.ok) {
    let details = ''

    try {
      const payload = await response.json()
      details = payload?.error || payload?.message || payload?.detail || ''
    } catch {
      details = await response.text()
    }

    const suffix = details ? `: ${details}` : ''
    throw new Error(`API ${response.status} ao acessar ${path}${suffix}`)
  }

  const payload = await response.json()

  if (payload && typeof payload === 'object' && payload.success === false) {
    const details = payload?.error || payload?.message || payload?.detail || 'Erro desconhecido na API'
    throw new Error(`API respondeu com falha ao acessar ${path}: ${details}`)
  }

  return payload
}

function pickArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.establishments)) return payload.establishments
  if (Array.isArray(payload?.orders)) return payload.orders
  return []
}

function pickObject(payload: any): JsonRecord | null {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      return payload.data
    }
    return payload
  }

  return null
}

async function fetchFirstArray(paths: string[], search?: Record<string, string | number | undefined>) {
  if (paths.length === 0) return []

  let lastError: unknown = null

  for (const path of paths) {
    try {
      const payload = await requestJson(path, search)
      return pickArray(payload)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Nenhum endpoint de lista respondeu')
}

async function fetchFirstObject(paths: string[], search?: Record<string, string | number | undefined>) {
  if (paths.length === 0) return null

  let lastError: unknown = null

  for (const path of paths) {
    try {
      const payload = await requestJson(path, search)
      return pickObject(payload)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Nenhum endpoint de detalhe respondeu')
}

function toNumber(value: any, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toStringValue(...values: any[]) {
  for (const value of values) {
    if (value === undefined || value === null) continue
    const text = String(value).trim()
    if (text) return text
  }

  return ''
}

function normalizeStatus(raw: any) {
  const status = toStringValue(raw?.status, raw?.situacao, raw?.state).toLowerCase()

  if (!status) return 'pending'
  if (['ativo', 'active', 'enabled'].includes(status)) return 'active'
  if (['pendente', 'pending', 'trial'].includes(status)) return 'pending'
  if (['inativo', 'inactive', 'disabled', 'blocked'].includes(status)) return 'inactive'
  return status
}

function normalizeEstablishment(raw: any): Establishment {
  const id = toStringValue(raw?.id, raw?.uuid, raw?.establishment_id, raw?._id)
  const slug = toStringValue(raw?.slug, raw?.store_slug, raw?.username, raw?.subdomain, id)

  return {
    id,
    owner_id: toStringValue(raw?.owner_id, raw?.user_id, raw?.responsavel_id, 'external-api'),
    name: toStringValue(raw?.name, raw?.nome, raw?.fantasy_name, raw?.business_name, 'Estabelecimento sem nome'),
    slug,
    logo_url: toStringValue(raw?.logo_url, raw?.logo, raw?.image, raw?.avatar) || null,
    phone: toStringValue(raw?.phone, raw?.telefone, raw?.whatsapp) || null,
    email: toStringValue(raw?.email) || null,
    address: toStringValue(raw?.address, raw?.endereco, raw?.full_address) || null,
    description: toStringValue(raw?.description, raw?.descricao, raw?.about) || null,
    primary_color: toStringValue(raw?.primary_color, raw?.cor_primaria) || null,
    secondary_color: toStringValue(raw?.secondary_color, raw?.cor_secundaria) || null,
    background_color: toStringValue(raw?.background_color, raw?.cor_fundo) || null,
    status: normalizeStatus(raw),
    trial_ends_at: raw?.trial_ends_at || raw?.trialEndsAt || null,
    created_at: raw?.created_at || raw?.createdAt || new Date().toISOString(),
    updated_at: raw?.updated_at || raw?.updatedAt || raw?.created_at || new Date().toISOString(),
  }
}

function normalizeOrder(raw: any, establishmentsMap?: Map<string, Establishment>): AdminOrder {
  const establishmentId = toStringValue(raw?.establishment_id, raw?.estabelecimento_id, raw?.store_id, raw?.establishment?.id)
  const nestedEstablishmentRaw = raw?.establishment || raw?.store || raw?.estabelecimento
  const normalizedNestedEstablishment = nestedEstablishmentRaw ? normalizeEstablishment(nestedEstablishmentRaw) : undefined
  const mappedEstablishment = normalizedNestedEstablishment || establishmentsMap?.get(establishmentId)

  return {
    id: toStringValue(raw?.id, raw?.uuid, raw?._id),
    establishment_id: establishmentId,
    customer_id: toStringValue(raw?.customer_id, raw?.cliente_id) || null,
    customer_name: toStringValue(raw?.customer_name, raw?.cliente_nome, raw?.customer?.name, raw?.user_name) || null,
    customer_phone: toStringValue(raw?.customer_phone, raw?.telefone, raw?.customer?.phone) || null,
    order_code: toStringValue(raw?.order_code, raw?.code, raw?.codigo, raw?.number) || null,
    payment_method: toStringValue(raw?.payment_method, raw?.metodo_pagamento, raw?.payment?.method) || null,
    payment_status: toStringValue(raw?.payment_status, raw?.status_pagamento, raw?.payment?.status) || null,
    platform_fee: toNumber(raw?.platform_fee ?? raw?.taxa_plataforma, 0),
    service_fee: toNumber(raw?.service_fee ?? raw?.taxa_servico, 0),
    service_issue_customer_pix_key: toStringValue(raw?.service_issue_customer_pix_key, raw?.pix_key, raw?.chave_pix_estorno) || null,
    status: toStringValue(raw?.status, raw?.situacao, raw?.order_status).toLowerCase() || 'pending',
    subtotal: toNumber(raw?.subtotal ?? raw?.valor_subtotal ?? raw?.amount, 0),
    total: toNumber(raw?.total ?? raw?.valor_total ?? raw?.amount_total, 0),
    notes: toStringValue(raw?.notes, raw?.observacoes) || null,
    mercadopago_payment_id: toStringValue(raw?.mercadopago_payment_id, raw?.payment_id) || null,
    created_at: raw?.created_at || raw?.createdAt || new Date().toISOString(),
    updated_at: raw?.updated_at || raw?.updatedAt || raw?.created_at || new Date().toISOString(),
    establishment: mappedEstablishment
      ? {
          id: mappedEstablishment.id,
          name: mappedEstablishment.name,
          slug: mappedEstablishment.slug,
          logo_url: mappedEstablishment.logo_url,
        }
      : null,
  }
}

function normalizeProduct(raw: any): Product {
  return {
    id: toStringValue(raw?.id, raw?.uuid, raw?._id),
    establishment_id: toStringValue(raw?.establishment_id, raw?.estabelecimento_id, raw?.store_id),
    category_id: toStringValue(raw?.category_id, raw?.categoria_id) || null,
    name: toStringValue(raw?.name, raw?.nome, 'Produto sem nome'),
    description: toStringValue(raw?.description, raw?.descricao) || null,
    image_url: toStringValue(raw?.image_url, raw?.image, raw?.foto_url) || null,
    price: toNumber(raw?.price ?? raw?.preco ?? raw?.valor, 0),
    available: typeof raw?.available === 'boolean'
      ? raw.available
      : ['true', '1', 'available', 'active', 'ativo'].includes(toStringValue(raw?.available, raw?.status).toLowerCase()),
    sort_order: toNumber(raw?.sort_order ?? raw?.ordem, 0),
    created_at: raw?.created_at || raw?.createdAt || new Date().toISOString(),
    updated_at: raw?.updated_at || raw?.updatedAt || raw?.created_at || new Date().toISOString(),
  }
}

function normalizeWithdrawal(raw: any): AdminWithdrawal {
  const establishmentId = toStringValue(raw?.establishment_id, raw?.store_id, raw?.estabelecimento_id)
  const establishmentName = toStringValue(
    raw?.establishment?.name,
    raw?.store?.name,
    raw?.establishment_name,
    raw?.store_name,
    raw?.nome_estabelecimento
  )
  const requestedAt = raw?.requested_at || raw?.created_at || raw?.createdAt || new Date().toISOString()
  const status = toStringValue(raw?.status, raw?.state, 'pending').toLowerCase()

  return {
    id: toStringValue(raw?.id, raw?.uuid, raw?._id),
    establishment_id: establishmentId,
    establishment: establishmentId || establishmentName
      ? {
          id: establishmentId,
          name: establishmentName || '',
        }
      : null,
    amount: toNumber(raw?.amount ?? raw?.requested_amount ?? raw?.valor ?? raw?.value, 0),
    requested_amount: toNumber(raw?.requested_amount ?? raw?.amount ?? raw?.valor ?? raw?.value, 0),
    pix_key: toStringValue(raw?.pix_key, raw?.pixKey, raw?.chave_pix, raw?.customer_pix_key) || null,
    requested_at: requestedAt,
    paid_at: raw?.paid_at || raw?.updated_at || null,
    status: status === 'paid' || status === 'rejected' ? status : 'pending',
    proof_url: toStringValue(raw?.proof_url, raw?.receipt_url, raw?.comprovante_url) || null,
    notes: toStringValue(raw?.notes, raw?.observation, raw?.observacao) || null,
    created_at: raw?.created_at || requestedAt,
    updated_at: raw?.updated_at || raw?.paid_at || requestedAt,
  }
}

export async function fetchAdminEstablishments(): Promise<Establishment[]> {
  try {
    // Pode haver rota `/public/establishments` que lista todos?
    // A instrução diz: "No backend atual NÃO existe rota de listagem geral tipo GET /v1/establishments?status=active."
    // Mas para master admin dashboard mantemos fallback ou buscamos `/public/establishments` se a API permitir.
    const items = await fetchFirstArray(ESTABLISHMENT_PATHS)
    return items.map(normalizeEstablishment).filter(item => item.id)
  } catch (error) {
    console.warn('Admin API establishments unavailable:', error)
    return []
  }
}

export async function fetchAdminEstablishmentById(id: string): Promise<Establishment | null> {
  try {
    const payload = await requestJson(`/admin/establishments/${id}`)
    const item = pickObject(payload)
    return item ? normalizeEstablishment(item) : null
  } catch (error) {
    console.warn(`Admin API establishment ${id} unavailable:`, error)
    return null
  }
}

function normalizeRefund(raw: any, establishmentsMap?: Map<string, Establishment>): AdminRefund {
  const establishmentId = toStringValue(
    raw?.establishment_id,
    raw?.store_id,
    raw?.order?.establishment_id,
    raw?.establishment?.id
  )
  const mappedEstablishment = establishmentsMap?.get(establishmentId)
  const establishmentName = toStringValue(
    raw?.establishment?.name,
    raw?.store?.name,
    raw?.establishment_name,
    raw?.store_name,
    mappedEstablishment?.name
  )

  return {
    id: toStringValue(raw?.id, raw?.uuid, raw?._id),
    order_id: toStringValue(raw?.order_id, raw?.order?.id),
    establishment_id: establishmentId,
    establishment: establishmentId || establishmentName
      ? {
          id: establishmentId,
          name: establishmentName || mappedEstablishment?.name || '',
        }
      : null,
    amount: toNumber(raw?.amount ?? raw?.refund_amount ?? raw?.total ?? raw?.value, 0),
    reason: toStringValue(raw?.reason, raw?.refund_reason, raw?.description) || null,
    status: toStringValue(raw?.status, raw?.state, 'pending').toLowerCase() || 'pending',
    customer_name: toStringValue(raw?.customer_name, raw?.customer?.name) || null,
    customer_phone: toStringValue(raw?.customer_phone, raw?.customer?.phone) || null,
    pix_key: toStringValue(raw?.pix_key, raw?.customer_pix_key, raw?.chave_pix) || null,
    created_at: raw?.created_at || raw?.requested_at || new Date().toISOString(),
    updated_at: raw?.updated_at || raw?.created_at || raw?.requested_at || new Date().toISOString(),
  }
}

export async function fetchOwnerEstablishment(ownerId: string): Promise<Establishment | null> {
  try {
    const item = await requestJson(`/establishments/owner/${ownerId}`)
    return item ? normalizeEstablishment(item) : null
  } catch (error) {
    console.warn(`Admin API owner establishment ${ownerId} unavailable:`, error)
    return null
  }
}

export async function fetchAdminOrders(establishmentId?: string): Promise<AdminOrder[]> {
  try {
    const [establishments, items] = await Promise.all([
      fetchAdminEstablishments(),
      fetchFirstArray(
        ORDER_PATHS,
        establishmentId ? { establishment_id: establishmentId } : undefined
      ),
    ])

    const establishmentsMap = new Map(establishments.map(item => [item.id, item]))

    return items
      .map(item => normalizeOrder(item, establishmentsMap))
      .filter(item => !establishmentId || item.establishment_id === establishmentId)
  } catch (error) {
    console.warn('Admin API orders unavailable:', error)
    return []
  }
}

export async function fetchAdminProducts(establishmentId?: string): Promise<Product[]> {
  try {
    const items = await fetchFirstArray(
      PRODUCT_PATHS,
      establishmentId ? { establishment_id: establishmentId } : undefined
    )

    return items
      .map(normalizeProduct)
      .filter(item => item.id && item.establishment_id)
  } catch (error) {
    console.warn('Admin API products unavailable:', error)
    return []
  }
}

export async function fetchAdminTopProducts(limit: number = 10): Promise<AdminTopProduct[]> {
  if (TOP_PRODUCTS_PATHS.length === 0) {
    // O backend atual nao oferece rota dedicada para top products global admin.
    return []
  }

  try {
    const items = await fetchFirstArray(TOP_PRODUCTS_PATHS, { limit })
    return items
      .map((item) => ({
        id: toStringValue(item?.id, item?.product_id, item?.uuid, item?._id),
        name: toStringValue(item?.name, item?.product_name, item?.nome, 'Produto'),
        quantity: toNumber(item?.quantity ?? item?.qty ?? item?.total_sold, 0),
        revenue: toNumber(item?.revenue ?? item?.gross_revenue ?? item?.total_revenue, 0),
      }))
      .filter(item => item.id || item.name)
      .slice(0, limit)
  } catch (error) {
    console.warn('Admin API top products unavailable:', error)
    return []
  }
}

export async function fetchAdminWallet(establishmentId: string) {
  try {
    // Rota EXATA da doc: GET /v1/financial/wallet?establishment_id=<uuid>&auto_backfill=true
    const data = await requestJson('/financial/wallet', { establishment_id: establishmentId, auto_backfill: 'true' })
    return data
  } catch (error) {
    console.error(`Admin API wallet failed for establishment ${establishmentId}:`, error)
    return null
  }
}

export async function createAdminWithdrawal(establishmentId: string, walletId: string, amount: number, pixKey: string, pixKeyType: string) {
  if (!establishmentId || !walletId) {
    throw new Error('Saque: sempre vincular establishment_id + wallet_id.')
  }
  
  // Validar saldo disponível antes (Regra: Bloquear saque sem saldo disponível)
  const wallet = await fetchAdminWallet(establishmentId);
  const availableBalance = wallet?.available_balance || wallet?.balance || 0;
  if (amount > availableBalance || availableBalance <= 0) {
    throw new Error('Bloqueado: Saque sem saldo disponível.')
  }
  
  try {
    // POST /v1/wallet/withdrawals
    const data = await requestJson('/wallet/withdrawals', undefined, {
      method: 'POST',
      body: {
        establishment_id: establishmentId,
        wallet_id: walletId,
        amount,
        pix_key: pixKey,
        pix_key_type: pixKeyType
      }
    })
    return data
  } catch (error) {
    console.error('Error creating withdrawal via API:', error)
    throw error
  }
}

export async function fetchAdminWithdrawals(establishmentId?: string, limit: number = 20): Promise<AdminWithdrawal[]> {
  try {
    const establishments = await fetchAdminEstablishments()
    const establishmentsMap = new Map(establishments.map((item) => [item.id, item]))

    // GET /v1/financial/withdrawals?establishment_id=<uuid>&limit=20
    const searchParams: Record<string, any> = { limit }
    if (establishmentId) {
      searchParams.establishment_id = establishmentId
    }
    const data = await requestJson('/financial/withdrawals', searchParams)
    return pickArray(data)
      .map((item) => {
        const normalized = normalizeWithdrawal(item)
        const mappedEstablishment = establishmentsMap.get(normalized.establishment_id)

        if (mappedEstablishment && (!normalized.establishment?.name || normalized.establishment.name === normalized.establishment_id)) {
          normalized.establishment = {
            id: mappedEstablishment.id,
            name: mappedEstablishment.name,
          }
        }

        return normalized
      })
      .filter(item => item.id)
  } catch (error) {
    console.warn('Admin API withdrawals unavailable:', error)
    return []
  }
}

export async function updateAdminWithdrawalStatus(
  establishmentId: string,
  withdrawalId: string,
  status: 'paid' | 'rejected',
  notes?: string
) {
  if (!establishmentId || !withdrawalId) {
    throw new Error('Atualização de saque requer establishment_id e withdrawal_id.')
  }

  return await requestJson('/financial/withdrawals/update-status', undefined, {
    method: 'POST',
    body: {
      establishment_id: establishmentId,
      withdrawal_id: withdrawalId,
      status,
      notes: notes || undefined,
    },
  })
}

export async function createRefundAPI(orderId: string, establishmentId: string, reason: string, requesterWaiterId: string | null = null, requesterWaiterName: string | null = null) {
  if (!orderId || !establishmentId) {
    throw new Error('Estorno cliente: sempre vincular order_id + establishment_id.')
  }
  try {
    // POST /v1/refunds/orders/:id
    return await requestJson(`/refunds/orders/${orderId}`, undefined, {
      method: 'POST',
      body: {
        order_id: orderId,
        establishment_id: establishmentId,
        requester_waiter_id: requesterWaiterId,
        requester_waiter_name: requesterWaiterName,
        reason
      }
    })
  } catch (error) {
    console.error(`Error creating refund for order ${orderId}:`, error)
    throw error
  }
}

export async function fetchRefundsAPI(establishmentId: string, orderIds: string) {
  try {
    // GET /v1/refunds?establishment_id=<uuid>&order_ids=<id1,id2,...>
    return await requestJson('/refunds', { establishment_id: establishmentId, order_ids: orderIds })
  } catch (error) {
    console.warn('Error fetching refunds:', error)
    return []
  }
}

export async function fetchOrderIssuesAPI(establishmentId: string, orderIds: string) {
  const orderIssueSearches = [
    { establishment_id: establishmentId, order_ids: orderIds, action: 'request_pix_refund' },
    { establishment_id: establishmentId, order_ids: orderIds, type: 'request_pix_refund' },
    { establishment_id: establishmentId, order_ids: orderIds },
    { establishment_id: establishmentId, action: 'request_pix_refund' },
    { establishment_id: establishmentId },
  ]

  let lastError: unknown = null

  for (const path of ORDER_ISSUE_PATHS) {
    for (const search of orderIssueSearches) {
      try {
        const payload = await requestJson(path, search)
        return pickArray(payload)
      } catch (error) {
        lastError = error
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Nenhum endpoint de order issues respondeu')
}

export async function fetchAdminRefunds(limitPerEstablishment: number = 200): Promise<AdminRefund[]> {
  try {
    const orders = await fetchAdminOrders()

    return orders
      .filter((order) => Boolean(order.service_issue_customer_pix_key))
      .slice(0, Math.max(limitPerEstablishment, 1) * 10)
      .map(normalizeRefundFromOrder)
      .filter((item): item is AdminRefund => item !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch (error) {
    console.warn('Admin refund requests unavailable via orders:', error)
    return []
  }
}

function normalizeRefundFromOrderIssue(raw: any, ordersMap?: Map<string, AdminOrder>, establishmentsMap?: Map<string, Establishment>): AdminRefund | null {
  const orderId = toStringValue(raw?.order_id, raw?.order?.id, raw?.pedido_id, raw?.reference_id)
  const linkedOrder = orderId ? ordersMap?.get(orderId) : undefined
  const establishmentId = toStringValue(
    raw?.establishment_id,
    raw?.establishment?.id,
    raw?.order?.establishment_id,
    linkedOrder?.establishment_id
  )
  const mappedEstablishment = establishmentsMap?.get(establishmentId)
  const establishmentName = toStringValue(
    raw?.establishment?.name,
    raw?.establishment_name,
    raw?.store_name,
    linkedOrder?.establishment?.name,
    mappedEstablishment?.name
  )
  const pixKey = toStringValue(
    raw?.pix_key,
    raw?.customer_pix_key,
    raw?.metadata?.pix_key,
    raw?.payload?.pix_key,
    linkedOrder?.service_issue_customer_pix_key
  ) || null

  if (!orderId || !establishmentId) {
    return null
  }

  return {
    id: toStringValue(raw?.id, raw?.uuid, raw?._id, `order-issue-${orderId}`),
    order_id: orderId,
    establishment_id: establishmentId,
    establishment: establishmentId || establishmentName
      ? {
          id: establishmentId,
          name: establishmentName || '',
        }
      : null,
    amount: toNumber(raw?.amount ?? raw?.refund_amount ?? linkedOrder?.total ?? linkedOrder?.subtotal, 0),
    reason: toStringValue(
      raw?.reason,
      raw?.description,
      raw?.message,
      raw?.metadata?.reason,
      raw?.payload?.reason,
      linkedOrder?.notes
    ) || 'Solicitacao de estorno registrada em order issue',
    status: toStringValue(raw?.status, raw?.state, raw?.situation, 'requested').toLowerCase() || 'requested',
    customer_name: toStringValue(raw?.customer_name, raw?.customer?.name, linkedOrder?.customer_name) || null,
    customer_phone: toStringValue(raw?.customer_phone, raw?.customer?.phone, linkedOrder?.customer_phone) || null,
    pix_key: pixKey,
    created_at: raw?.created_at || raw?.requested_at || raw?.updated_at || linkedOrder?.updated_at || linkedOrder?.created_at || new Date().toISOString(),
    updated_at: raw?.updated_at || raw?.created_at || linkedOrder?.updated_at || linkedOrder?.created_at || new Date().toISOString(),
  }
}

export async function orderIssueActionAPI(orderId: string, actionBody: any) {
  if (actionBody.action === 'request_pix_refund' && !actionBody.pix_key) {
    throw new Error('Bloquear ação de PIX: pix_key vazio.')
  }
  try {
    // POST /v1/order-issues/:orderId/actions
    return await requestJson(`/order-issues/${orderId}/actions`, undefined, {
      method: 'POST',
      body: actionBody
    })
  } catch (error) {
    console.error(`Error on order issue action for order ${orderId}:`, error)
    throw error
  }
}

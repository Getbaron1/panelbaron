import type { Establishment } from '@/integrations/supabase/types'

// Em produção (Netlify), usar o proxy /api para evitar CORS.
// Em dev local, usar URL direta da API.
const IS_PRODUCTION = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
const ADMIN_API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || (IS_PRODUCTION ? '/api' : 'https://api.getbaron.com.br/v1')
const API_TOKEN = import.meta.env.VITE_ADMIN_API_TOKEN || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const API_KEY = import.meta.env.VITE_ADMIN_API_KEY || ''

const DEFAULT_ESTABLISHMENT_PATHS = ['/public/establishments', '/admin/establishments', '/establishments']
const DEFAULT_ORDER_PATHS = ['/public/orders', '/admin/orders', '/orders']

function readPathsFromEnv(envValue: string | undefined, fallback: string[]) {
  const paths = (envValue || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  return paths.length > 0 ? paths : fallback
}

const ESTABLISHMENT_PATHS = readPathsFromEnv(import.meta.env.VITE_ADMIN_ESTABLISHMENTS_PATHS, DEFAULT_ESTABLISHMENT_PATHS)
const ORDER_PATHS = readPathsFromEnv(import.meta.env.VITE_ADMIN_ORDERS_PATHS, DEFAULT_ORDER_PATHS)

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

async function requestJson(path: string, search?: Record<string, string | number | undefined>, options?: { method?: string; body?: any }) {
  const cleanBase = ADMIN_API_BASE_URL.replace(/\/+$/, '')
  const cleanPath = path.replace(/^\/+/, '').replace(/\/+$/, '')
  const rawUrl = `${cleanBase}/${cleanPath}`

  // Se a URL for relativa (/api/...), precisamos de uma base absoluta para new URL()
  const isRelative = rawUrl.startsWith('/')
  const url = isRelative
    ? new URL(rawUrl, window.location.origin)
    : new URL(rawUrl)

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
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
  } catch (e) {}
  
  if (API_KEY) {
    headers['x-api-key'] = API_KEY
  }

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

  return response.json()
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
    const item = await requestJson(`/public/establishments/${id}`)
    return item ? normalizeEstablishment(item) : null
  } catch (error) {
    console.warn(`Admin API establishment ${id} unavailable:`, error)
    return null
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

export async function fetchAdminWithdrawals(establishmentId?: string, limit: number = 20) {
  try {
    // GET /v1/financial/withdrawals?establishment_id=<uuid>&limit=20
    const searchParams: Record<string, any> = { limit }
    if (establishmentId) {
      searchParams.establishment_id = establishmentId
    }
    const data = await requestJson('/financial/withdrawals', searchParams)
    return pickArray(data)
  } catch (error) {
    console.warn('Admin API withdrawals unavailable:', error)
    return []
  }
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

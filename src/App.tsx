import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from './components/layout/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import ClienteDetalhes from './pages/ClienteDetalhes'
import EstabelecimentoDetalhes from './pages/EstabelecimentoDetalhes'
import Pedidos from './pages/Pedidos'
import Faturamento from './pages/Faturamento'
import Mapa from './pages/Mapa'
import Comercial from './pages/Comercial'
import Reunioes from './pages/Comercial/Reunioes'
import Comissoes from './pages/Comercial/Comissoes'
import Login from './pages/Login'
import Suporte from './pages/Suporte'
import AnalyticsGabigol from './pages/AnalyticsGabigol'

type AdminUser = {
  id: string
  email: string
  nome: string
  role: string
}

const ADMIN_EMAIL_ROLE_FALLBACKS: Record<string, string> = {
  'pedrocoelhowz1@gmail.com': 'admin',
}

function buildFallbackUser(session: any): AdminUser | null {
  const user = session?.user
  const email = String(user?.email || '').trim()
  const normalizedEmail = email.toLowerCase()

  if (!user?.id || !email) {
    return null
  }

  return {
    id: String(user.id),
    email,
    nome: String(user?.user_metadata?.name || email),
    role: String(
      user?.user_metadata?.role ||
      ADMIN_EMAIL_ROLE_FALLBACKS[normalizedEmail] ||
      'authenticated'
    ),
  }
}

function getStoredAdminUser(): AdminUser | null {
  try {
    const userData = localStorage.getItem('baron_admin_user')
    if (!userData) return null
    return JSON.parse(userData) as AdminUser
  } catch {
    return null
  }
}

function getUserRole(): string {
  return getStoredAdminUser()?.role || 'comercial'
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const userRole = getUserRole()
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

async function fetchAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const normalizedEmail = email.trim().toLowerCase()
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, nome, role, ativo')
    .ilike('email', normalizedEmail)

  if (error) {
    return null
  }

  const item = (data || []).find((current: any) => String(current?.email || '').trim().toLowerCase() === normalizedEmail)

  if (!item || item.ativo === false) {
    return null
  }

  return {
    id: String(item.id),
    email: String(item.email),
    nome: String(item.nome || item.email),
    role: String(item.role || 'authenticated'),
  }
}

async function resolveAuthenticatedUser(session: any): Promise<AdminUser | null> {
  const email = session?.user?.email

  if (!email) {
    return buildFallbackUser(session)
  }

  const adminUser = await fetchAdminUserByEmail(email)
  return adminUser || buildFallbackUser(session)
}

async function validateCredentials(email: string, password: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()

  try {
    await supabase.auth.signOut()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error || !data.session) {
      return false
    }

    const user = await resolveAuthenticatedUser(data.session)
    if (!user) {
      return false
    }

    localStorage.setItem('baron_admin_user', JSON.stringify(user))
    return true
  } catch {
    return false
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      const { data } = await supabase.auth.getSession()
      const session = data.session

      if (!session) {
        localStorage.removeItem('baron_admin_user')
        localStorage.removeItem('baron_admin_session')
        if (mounted) {
          setIsAuthenticated(false)
          setIsLoading(false)
        }
        return
      }

      const user = await resolveAuthenticatedUser(session)
      if (!user) {
        localStorage.removeItem('baron_admin_user')
        localStorage.removeItem('baron_admin_session')
        if (mounted) {
          setIsAuthenticated(false)
          setIsLoading(false)
        }
        return
      }

      localStorage.setItem('baron_admin_user', JSON.stringify(user))
      localStorage.setItem('baron_admin_session', 'true')

      if (mounted) {
        setIsAuthenticated(true)
        setIsLoading(false)
      }
    }

    void bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        localStorage.removeItem('baron_admin_user')
        localStorage.removeItem('baron_admin_session')
        if (mounted) {
          setIsAuthenticated(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleLogin = async (email: string, password: string) => {
    const success = await validateCredentials(email, password)
    if (success) {
      localStorage.setItem('baron_admin_session', 'true')
      setIsAuthenticated(true)
    }
    return success
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('baron_admin_user')
    localStorage.removeItem('baron_admin_session')
    localStorage.removeItem('baron_saved_credentials')
    Object.keys(localStorage).forEach((key) => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key)
      }
    })
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-2xl animate-pulse">Carregando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <BrowserRouter>
      <DashboardLayout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClienteDetalhes />} />
          <Route path="/estabelecimentos/:id" element={<EstabelecimentoDetalhes />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route
            path="/faturamento"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <Faturamento />
              </ProtectedRoute>
            }
          />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/comercial" element={<Comercial />} />
          <Route path="/comercial/reunioes" element={<Reunioes />} />
          <Route path="/comercial/comissoes" element={<Comissoes />} />
          <Route path="/suporte" element={<Suporte />} />
          <Route
            path="/analytics/gabigol"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'viewer']}>
                <AnalyticsGabigol />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  )
}

export default App

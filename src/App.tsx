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

// FunÃ§Ã£o para obter role do usuÃ¡rio
function getUserRole(): string {
  try {
    const userData = localStorage.getItem('baron_admin_user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.role || 'comercial';
    }
  } catch {
    // Ignora erro
  }
  return 'comercial';
}

// Componente para proteger rotas por role
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const userRole = getUserRole();
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

// FunÃ§Ã£o para validar credenciais contra Supabase
async function validateCredentials(email: string, password: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-login', {
      body: {
        email: email.trim().toLowerCase(),
        password
      }
    })

    if (error || !data?.ok || !data?.user) {
      return false
    }

    localStorage.setItem('baron_admin_user', JSON.stringify(data.user))

    return true
  } catch (err) {
    console.error('Erro ao validar credenciais')
    return false
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const hasSession = localStorage.getItem('baron_admin_session') === 'true'
    const user = localStorage.getItem('baron_admin_user')
    setIsAuthenticated(hasSession && !!user)
    setIsLoading(false)
  }, [])

  const handleLogin = async (email: string, password: string) => {
    const success = await validateCredentials(email, password)
    if (success) {
      localStorage.setItem('baron_admin_session', 'true')
      setIsAuthenticated(true)
    }
    return success
  }

  const handleLogout = () => {
    localStorage.removeItem('baron_admin_user')
    localStorage.removeItem('baron_admin_session')
    localStorage.removeItem('baron_saved_credentials') // Remover credenciais salvas para impedir login automÃ¡tico
    // Limpar todas as chaves do localStorage relacionadas ao Supabase
    Object.keys(localStorage).forEach(key => {
      if ((key.includes('supabase') || key.includes('auth'))) {
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
          <Route path="/faturamento" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <Faturamento />
            </ProtectedRoute>
          } />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/comercial" element={<Comercial />} />
          <Route path="/comercial/reunioes" element={<Reunioes />} />
          <Route path="/comercial/comissoes" element={<Comissoes />} />
          <Route path="/suporte" element={<Suporte />} />
          <Route path="/analytics/gabigol" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin', 'viewer']}>
              <AnalyticsGabigol />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  )
}

export default App

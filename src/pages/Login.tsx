import { useState, useEffect } from 'react'
import { Shield, Eye, EyeOff } from 'lucide-react'
import getbaronLogo from '@/assets/getbaron-logo.png'

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false)

  // Carregar credenciais salvas e fazer login automático
  useEffect(() => {
    const savedCredentials = localStorage.getItem('baron_saved_credentials')
    if (savedCredentials && !autoLoginAttempted) {
      try {
        const { email: savedEmail, password: savedPassword } = JSON.parse(savedCredentials)
        if (savedEmail && savedPassword) {
          setEmail(savedEmail)
          setPassword(savedPassword)
          setRememberMe(true)
          
          // Fazer login automático
          setAutoLoginAttempted(true)
          setIsLoading(true)
          
          onLogin(savedEmail, savedPassword).then((success) => {
            if (!success) {
              setError('Sessão expirada. Faça login novamente.')
              localStorage.removeItem('baron_saved_credentials')
            }
            setIsLoading(false)
          }).catch(() => {
            setIsLoading(false)
          })
        }
      } catch {
        // Ignorar erro de parse
      }
    }
  }, [onLogin, autoLoginAttempted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const success = await onLogin(email, password)
      
      if (success) {
        // Salvar ou remover credenciais baseado na opção
        if (rememberMe) {
          localStorage.setItem('baron_saved_credentials', JSON.stringify({ email, password }))
        } else {
          localStorage.removeItem('baron_saved_credentials')
        }
      } else {
        setError('Email ou senha inválidos. Verifique suas credenciais.')
      }
    } catch (err) {
      console.error('Erro no login:', err)
      setError('Erro ao conectar ao servidor. Tente novamente.')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={getbaronLogo} 
            alt="getbaron" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-primary">ADMIN PANEL</span>
          </div>
          <p className="text-muted-foreground">Painel Administrativo Master</p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-8">
          <h2 className="text-xl font-semibold text-center mb-6 text-foreground">Acesso Restrito</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                placeholder="admin@baroncontrol.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 px-4 rounded-xl bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-foreground mb-2">Senha</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 px-4 pr-10 rounded-xl bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Lembrar de mim */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer select-none">
                Lembrar meus dados
              </label>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Autenticando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Este painel é restrito aos administradores do sistema Baron Control.
            </p>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-6">
          © 2026 getbaron - Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}

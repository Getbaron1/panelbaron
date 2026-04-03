import { useState, useEffect } from 'react'
import { 
  User, 
  Shield, 
  Bell, 
  Database,
  Key,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function Configuracoes() {
  const [showSupabaseKey, setShowSupabaseKey] = useState(false)
  const [userEmail, setUserEmail] = useState('admin@baroncontrol.com')
  const [settings, setSettings] = useState({
    supabaseUrl: '',
    supabaseKey: '',
    notificacoesEmail: true,
    notificacoesPush: false,
    temaEscuro: true,
    backupAutomatico: true
  })

  useEffect(() => {
    const userData = localStorage.getItem('baron_admin_user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserEmail(user.email || 'admin@baroncontrol.com')
      } catch (e) {
        console.error('Erro ao ler dados do usuário')
      }
    }
  }, [])

  const handleSave = () => {
    // Salvar configurações
    alert('Configurações salvas com sucesso!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do painel administrativo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Navigation */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Database className="w-5 h-5" />
            <span className="font-medium">Banco de Dados</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground">
            <User className="w-5 h-5" />
            <span className="font-medium">Perfil</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground">
            <Shield className="w-5 h-5" />
            <span className="font-medium">Segurança</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground">
            <Bell className="w-5 h-5" />
            <span className="font-medium">Notificações</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supabase Config */}
          <Card title="Configuração do Supabase" action={
            <Database className="w-5 h-5 text-primary" />
          }>
            <p className="text-sm text-muted-foreground mb-4">
              Configure a conexão com o banco de dados Supabase para sincronizar os dados reais do sistema.
            </p>
            
            <div className="space-y-4">
              <Input
                label="Supabase URL"
                placeholder="https://seu-projeto.supabase.co"
                value={settings.supabaseUrl}
                onChange={(e) => setSettings({ ...settings, supabaseUrl: e.target.value })}
              />
              
              <div className="relative">
                <Input
                  label="Supabase Anon Key"
                  type={showSupabaseKey ? 'text' : 'password'}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={settings.supabaseKey}
                  onChange={(e) => setSettings({ ...settings, supabaseKey: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                  className="absolute right-3 top-8 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showSupabaseKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-4 bg-muted/50 rounded-xl">
                <h4 className="font-medium mb-2">Variáveis de Ambiente</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Você também pode configurar via arquivo .env:
                </p>
                <code className="block text-xs bg-slate-900 text-slate-50 p-3 rounded-xl font-mono">
                  VITE_SUPABASE_URL=https://seu-projeto.supabase.co<br/>
                  VITE_SUPABASE_ANON_KEY=sua-anon-key
                </code>
              </div>
            </div>
          </Card>

          {/* Credenciais de Acesso */}
          <Card title="Credenciais de Acesso Master" action={
            <Key className="w-5 h-5 text-primary" />
          }>
            <p className="text-sm text-muted-foreground mb-4">
              Credenciais atuais para acesso ao painel administrativo.
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl">
                <p className="text-sm text-warning font-medium mb-2">⚠️ Credenciais de Demonstração</p>
                <p className="text-xs text-muted-foreground">
                  Em produção, implemente autenticação segura via Supabase Auth ou outro provedor.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-mono text-sm">{userEmail}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs text-muted-foreground">Senha</p>
                  <p className="font-mono text-sm">••••••••••</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Notificações */}
          <Card title="Preferências de Notificação" action={
            <Bell className="w-5 h-5 text-primary" />
          }>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-muted/50 rounded-xl cursor-pointer">
                <div>
                  <p className="font-medium">Notificações por Email</p>
                  <p className="text-sm text-muted-foreground">Receba alertas importantes por email</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notificacoesEmail}
                  onChange={(e) => setSettings({ ...settings, notificacoesEmail: e.target.checked })}
                  className="w-5 h-5 rounded accent-primary"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-muted/50 rounded-xl cursor-pointer">
                <div>
                  <p className="font-medium">Notificações Push</p>
                  <p className="text-sm text-muted-foreground">Receba notificações no navegador</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notificacoesPush}
                  onChange={(e) => setSettings({ ...settings, notificacoesPush: e.target.checked })}
                  className="w-5 h-5 rounded accent-primary"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-muted/50 rounded-xl cursor-pointer">
                <div>
                  <p className="font-medium">Backup Automático</p>
                  <p className="text-sm text-muted-foreground">Ativar backup automático diário</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.backupAutomatico}
                  onChange={(e) => setSettings({ ...settings, backupAutomatico: e.target.checked })}
                  className="w-5 h-5 rounded accent-primary"
                />
              </label>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleSave}>
              <Save className="w-4 h-4" />
              Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

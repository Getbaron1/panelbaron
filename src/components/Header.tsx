import { Bell, Search, LogOut, User } from 'lucide-react'

interface HeaderProps {
  onLogout: () => void
}

export default function Header({ onLogout }: HeaderProps) {
  return (
    <header className="h-[73px] border-b border-baron-gold/20 bg-baron-darker/50 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar clientes, pedidos..."
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-baron-gold/50 focus:border-baron-gold transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-baron-gold rounded-full"></span>
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-medium">Admin Master</p>
            <p className="text-xs text-muted-foreground">Super Administrador</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-baron-gold to-yellow-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-baron-darker" />
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

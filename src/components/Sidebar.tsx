import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building,
  DollarSign,
  TrendingUp,
  BarChart3,
  Headphones,
  MapPin,
  Crown
} from 'lucide-react'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/faturamento', icon: DollarSign, label: 'Faturamento' },
  { path: '/clientes', icon: Building, label: 'Estabelecimentos' },
  { path: '/comercial', icon: TrendingUp, label: 'Comercial' },
  { path: '/analytics/gabigol', icon: BarChart3, label: 'Consultor BI' },
  { path: '/suporte', icon: Headphones, label: 'Suporte' },
  { path: '/mapa', icon: MapPin, label: 'Mapa' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-baron-darker border-r border-baron-gold/20 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-baron-gold/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-baron-gold to-yellow-600 rounded-lg flex items-center justify-center">
            <Crown className="w-6 h-6 text-baron-darker" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Baron Control</h1>
            <p className="text-xs text-muted-foreground">Painel Master</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-baron-gold/20 text-baron-gold border border-baron-gold/30'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-baron-gold/20">
        <div className="glass rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Versão</p>
          <p className="text-sm font-semibold text-baron-gold">1.0.0 Master</p>
        </div>
      </div>
    </aside>
  )
}

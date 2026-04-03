import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Menu,
  Shield,
  Briefcase,
  MessageCircle,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import getbaronLogo from "@/assets/getbaron-logo.png";

// Itens de menu com controle de acesso por role
// roles: undefined = todos podem ver, ['admin'] = apenas admin, etc.
const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: undefined },
  { title: "Faturamento", url: "/faturamento", icon: DollarSign, roles: ['admin', 'super_admin'] as const },
  { title: "Estabelecimentos", url: "/clientes", icon: Building2, roles: undefined },
  { title: "Comercial", url: "/comercial", icon: Briefcase, roles: undefined },
  { title: "Consultor BI", url: "/analytics/gabigol", icon: BarChart3, roles: ['admin', 'super_admin', 'viewer'] as const },
  { title: "Suporte", url: "/suporte", icon: MessageCircle, roles: undefined },
];

// Função para obter o role do usuário logado
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

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const [userRole, setUserRole] = useState<string>('comercial');

  useEffect(() => {
    setUserRole(getUserRole());
  }, []);

  // Filtrar itens de menu baseado no role do usuário
  const filteredMenuItems = menuItems.filter(item => {
    // Se não tem restrição de role, todos podem ver
    if (!item.roles) return true;
    // Se tem restrição, verificar se o role do usuário está na lista
    return item.roles.includes(userRole as any);
  });

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border/50 transition-all duration-300 ease-in-out flex flex-col",
          collapsed ? "w-20" : "w-64",
          collapsed && "max-lg:-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
          <div className={cn(
            "flex items-center gap-3 transition-all duration-300",
            collapsed && "justify-center w-full"
          )}>
            <img
              src={getbaronLogo}
              alt="getbaron"
              className={cn(
                "transition-all duration-300",
                collapsed ? "h-8 w-auto" : "h-10 w-auto"
              )}
            />
            {!collapsed && (
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary">ADMIN</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {filteredMenuItems.map((item, index) => {
              const isActive = location.pathname === item.url || 
                (item.url !== '/' && location.pathname.startsWith(item.url));
              return (
                <li
                  key={item.title}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="animate-slide-in-left"
                >
                  <NavLink
                    to={item.url}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                        !isActive && "group-hover:scale-110",
                        collapsed && "mx-auto"
                      )}
                    />
                    {!collapsed && (
                      <span className="truncate">{item.title}</span>
                    )}

                    {/* Active indicator */}
                    {isActive && !collapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse Button */}
        <div className="p-3 border-t border-border/50">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span>Recolher</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

// Mobile menu trigger
export function MobileMenuTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-card border border-border shadow-lg hover:bg-muted transition-colors"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

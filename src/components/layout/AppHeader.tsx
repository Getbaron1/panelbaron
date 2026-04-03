import { useState, useEffect } from "react";
import { Bell, ChevronDown, Search, LogOut, X, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface AppHeaderProps {
  sidebarCollapsed?: boolean;
  onLogout?: () => void;
}

export function AppHeader({ sidebarCollapsed = false, onLogout }: AppHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [userEmail, setUserEmail] = useState('admin@baroncontrol.com');
  const [userName, setUserName] = useState('Administrador');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('baron_admin_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserEmail(user.email || 'admin@baroncontrol.com');
        setUserName(user.nome || 'Administrador');
      } catch (e) {
        console.error('Erro ao ler dados do usuário');
      }
    }
  }, []);

  const handleSignOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('baron-admin-auth');
    }
    navigate("/login");
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-card/95 backdrop-blur-md border-b border-border/50 transition-all duration-300 flex items-center justify-between px-4 md:px-6",
        sidebarCollapsed ? "left-0 lg:left-20" : "left-0 lg:left-64"
      )}
    >
      {/* Left Side - Title */}
      <div className="flex items-center gap-4 pl-12 lg:pl-0">
        <div className="hidden sm:flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-base md:text-lg font-semibold text-foreground">
            Painel Administrativo
          </h1>
        </div>
      </div>

      {/* Center - Search (Desktop) */}
      <div className="hidden md:flex items-center relative max-w-md flex-1 mx-8">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar estabelecimentos, pedidos..."
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
        />
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile Search */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <Search className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
              <span className="text-xs font-bold text-primary-foreground">
                AD
              </span>
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">
              Admin
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">
                    {userName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-3 text-left text-sm text-destructive hover:bg-muted flex items-center gap-3 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sair da conta
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="absolute inset-x-0 top-full bg-card border-b border-border p-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              autoFocus
              className="w-full h-10 pl-10 pr-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={() => setShowSearch(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

import { ReactNode, useState } from "react";
import { AppSidebar, MobileMenuTrigger } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode
  onLogout?: () => void
}

export function DashboardLayout({ children, onLogout }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Trigger */}
      <MobileMenuTrigger onClick={() => setSidebarCollapsed(false)} />

      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <AppHeader sidebarCollapsed={sidebarCollapsed} onLogout={onLogout} />

      {/* Main Content */}
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

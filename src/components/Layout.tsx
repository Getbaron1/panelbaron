import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
  onLogout: () => void
}

export default function Layout({ children, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-baron-darker via-baron-dark to-baron-darker">
      <Sidebar />
      <div className="ml-64">
        <Header onLogout={onLogout} />
        <main className="p-6 min-h-[calc(100vh-73px)]">
          {children}
        </main>
      </div>
    </div>
  )
}

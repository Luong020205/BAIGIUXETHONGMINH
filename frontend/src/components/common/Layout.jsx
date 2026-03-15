import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuth } from '../../hooks/useAuth'

export const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { profile } = useAuth()

  // Close sidebar on route/role change or after login
  React.useEffect(() => {
    setIsSidebarOpen(false)
  }, [profile])

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        <footer className="px-4 py-6 border-t border-slate-100 text-center text-sm text-slate-400">
          © 2026 Parking Pro System. All rights reserved.
        </footer>
      </div>

    </div>
  )
}

import React from 'react'
import { Menu, Bell } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export const Header = ({ onMenuClick }) => {
  const { profile } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-100 lg:px-8 h-16">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 text-slate-600 lg:hidden hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900 hidden lg:block">
          Hệ thống Quản lý Bãi xe
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block"></div>
        
        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900 group-hover:text-primary-600 transition-colors">
              {profile?.full_name}
            </p>
            <p className="text-xs text-slate-500 capitalize leading-none">
              {profile?.role}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
            {profile?.full_name?.[0] || 'U'}
          </div>
        </div>
      </div>
    </header>
  )
}

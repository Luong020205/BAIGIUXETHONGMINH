import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  MapPin, 
  Banknote, 
  Users, 
  BarChart3, 
  History,
  Home,
  CheckCircle2,
  ListOrdered,
  Search,
  Car,
  Receipt,
  LogOut,
  X
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROLES } from '../../utils/constants'
import { twMerge } from 'tailwind-merge'

export const Sidebar = ({ isOpen, onClose }) => {
  const { profile, logout, isAdmin, isEmployee, isCustomer } = useAuth()

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Tổng quan' },
    { to: '/admin/areas', icon: MapPin, label: 'Khu vực đỗ' },
    { to: '/admin/pricing', icon: Banknote, label: 'Bảng giá' },
    { to: '/admin/users', icon: Users, label: 'Người dùng' },
    { to: '/admin/reports', icon: BarChart3, label: 'Báo cáo' },
    { to: '/admin/history', icon: History, label: 'Lịch sử' },
  ]

  const employeeLinks = [
    { to: '/employee', icon: Home, label: 'Trang chủ' },
    { to: '/employee/check-in', icon: CheckCircle2, label: 'Nhận xe' },
    { to: '/employee/check-out', icon: LogOut, label: 'Trả xe' },
    { to: '/employee/vehicles', icon: ListOrdered, label: 'Danh sách xe' },
    { to: '/employee/search', icon: Search, label: 'Tra cứu' },
  ]

  const customerLinks = [
    { to: '/customer', icon: Home, label: 'Trang chủ' },
    { to: '/customer/vehicles', icon: Car, label: 'Xe của tôi' },
    { to: '/customer/history', icon: History, label: 'Lịch sử gửi xe' },
    { to: '/customer/invoices', icon: Receipt, label: 'Hóa đơn' },
  ]

  const links = isAdmin ? adminLinks : isEmployee ? employeeLinks : isCustomer ? customerLinks : []

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={twMerge(
        'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-100 transition-transform duration-300 transform lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                Parking Pro
              </span>
            </div>
            <button onClick={onClose} className="lg:hidden p-1 text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to.length <= 9}
                className={({ isActive }) => twMerge(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose()
                }}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-slate-50">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase">
                {profile?.full_name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{profile?.full_name}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{profile?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center justify-center w-full gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

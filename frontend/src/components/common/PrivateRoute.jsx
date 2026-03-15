import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Loader2 } from 'lucide-react'

export const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    // If we have a profile but no permission, redirect to their home
    if (profile) {
      const homePaths = {
        admin: '/admin',
        employee: '/employee',
        customer: '/customer'
      }
      return <Navigate to={homePaths[profile.role] || '/login'} replace />
    }
    // If we are authenticated but have NO profile, don't just redirect to login (loop!)
    // The App.jsx HomeByRole already handles the "no profile" error state.
    // So if we are here, we might just want to go to / to see that error.
    return <Navigate to="/" replace />
  }

  return children
}

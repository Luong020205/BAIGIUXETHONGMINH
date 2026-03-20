import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/common/Layout'
import { PrivateRoute } from './components/common/PrivateRoute'
import { ToastContainer } from './components/common/Toast'
import { ROLES } from './utils/constants'
import { Loader2 } from 'lucide-react'

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))

// Admin Pages
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Areas = lazy(() => import('./pages/admin/Areas'))
const Pricing = lazy(() => import('./pages/admin/Pricing'))
const Users = lazy(() => import('./pages/admin/Users'))
const Reports = lazy(() => import('./pages/admin/Reports'))
const History = lazy(() => import('./pages/admin/History'))

// Employee Pages
const EmployeeHome = lazy(() => import('./pages/employee/Home'))
const CheckIn = lazy(() => import('./pages/employee/CheckIn'))
const CheckOut = lazy(() => import('./pages/employee/CheckOut'))
const VehicleList = lazy(() => import('./pages/employee/VehicleList'))
const SearchHistory = lazy(() => import('./pages/employee/SearchHistory'))

// Customer Pages
const CustomerHome = lazy(() => import('./pages/customer/Home'))
const MyVehicles = lazy(() => import('./pages/customer/MyVehicles'))
const MyHistory = lazy(() => import('./pages/customer/MyHistory'))
const Invoices = lazy(() => import('./pages/customer/Invoices'))
const MonthlyCard = lazy(() => import('./pages/customer/MonthlyCard'))

// Redirect based on role if at base "/"
const HomeByRole = ({ user, profile, loading }) => {
  // Only show full screen loading if we don't have a profile yet
  if (loading && !profile) {
    return <LoadingScreen />
  }

  if (!user) return <Navigate to="/login" replace />

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy hồ sơ</h3>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              Thử tải lại trang
            </button>
            <button 
              onClick={async () => {
                const { supabase } = await import('./utils/supabaseClient')
                await supabase.auth.signOut()
                window.location.href = '/login'
              }}
              className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (profile.role === ROLES.ADMIN) return <Navigate to="/admin" replace />
  if (profile.role === ROLES.EMPLOYEE) return <Navigate to="/employee" replace />
  if (profile.role === ROLES.CUSTOMER) return <Navigate to="/customer" replace />
  
  // Fallback if role is unknown
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center max-w-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Vai trò không hợp lệ</h3>
        <p className="text-slate-500 mb-6">Tài khoản của bạn có vai trò "{profile.role}" không tồn tại trong hệ thống.</p>
        <button 
          onClick={async () => {
            const { supabase } = await import('./utils/supabaseClient')
            await supabase.auth.signOut()
            window.location.href = '/login'
          }}
          className="w-full py-2 bg-primary-600 text-white rounded-xl font-semibold transition-colors"
        >
          Quay lại đăng nhập
        </button>
      </div>
    </div>
  )
}

// Shared Loading Component
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
    <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
    <p className="text-slate-500 font-medium animate-pulse text-sm">Đang tải ứng dụng...</p>
  </div>
)

function App() {
  const { user, profile, loading } = useAuth()

  // During initial auth initialization where we don't know if there's a user yet
  if (loading && !user && !profile) {
    return <LoadingScreen />
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/" element={<HomeByRole user={user} profile={profile} loading={loading} />} />

      {/* Admin Protected Routes */}
      <Route path="/admin" element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="areas" element={<Areas />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="users" element={<Users />} />
        <Route path="reports" element={<Reports />} />
        <Route path="history" element={<History />} />
      </Route>

      {/* Employee Protected Routes */}
      <Route path="/employee" element={
        <PrivateRoute allowedRoles={[ROLES.EMPLOYEE]}>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<EmployeeHome />} />
        <Route path="check-in" element={<CheckIn />} />
        <Route path="check-out" element={<CheckOut />} />
        <Route path="vehicles" element={<VehicleList />} />
        <Route path="search" element={<SearchHistory />} />
      </Route>

      {/* Customer Protected Routes */}
      <Route path="/customer" element={
        <PrivateRoute allowedRoles={[ROLES.CUSTOMER]}>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<CustomerHome />} />
        <Route path="vehicles" element={<MyVehicles />} />
        <Route path="monthly-card" element={<MonthlyCard />} />
        <Route path="history" element={<MyHistory />} />
        <Route path="invoices" element={<Invoices />} />
      </Route>

      {/* 404 Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </Suspense>
  )
}

export default App

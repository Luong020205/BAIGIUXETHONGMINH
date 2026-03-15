import React, { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { useToast } from '../../context/ToastContext'
import { Car, Lock, Mail } from 'lucide-react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login, user, profile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  React.useEffect(() => {
    // Chỉ chuyển hướng nếu CẢ user và profile đều có
    // Điều này tránh vòng lặp nếu có user nhưng profile chưa load xong hoặc lỗi
    if (user && profile) {
      navigate('/', { replace: true })
    }
  }, [user, profile, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      return showToast('Vui lòng nhập đầy đủ email và mật khẩu', 'error')
    }

    setLoading(true)
    try {
      await login(email, password)
      showToast('Đăng nhập thành công!', 'success')
      
      // Sau khi login thành công, AuthContext sẽ tự động cập nhật profile
      // Redirect về trang chủ hoặc trang trước đó
      navigate(from, { replace: true })
    } catch (error) {
      showToast(error.message || 'Đăng nhập thất bại', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 shadow-lg mb-4">
            <Car className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Chào mừng trở lại</h1>
          <p className="text-slate-500 mt-2">Hệ thống Quản lý Bãi xe Thông minh</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              icon={Mail}
              required
            />
            <Input
              label="Mật khẩu"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              icon={Lock}
              required
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="font-medium text-primary-600 hover:text-primary-700">Quên mật khẩu?</a>
            </div>

            <Button
              type="submit"
              className="w-full py-3"
              loading={loading}
            >
              Đăng nhập
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-600">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
        
        <p className="text-center text-slate-400 text-xs mt-8">
          © 2026 Parking Pro. Phát triển bởi AI Assistant.
        </p>
      </div>
    </div>
  )
}

export default Login

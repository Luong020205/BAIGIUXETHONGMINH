import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { useToast } from '../../context/ToastContext'
import { Car, User, Phone, Mail, Lock } from 'lucide-react'

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      return showToast('Mật khẩu xác nhận không khớp', 'error')
    }
    
    if (formData.password.length < 6) {
      return showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error')
    }

    setLoading(true)
    try {
      await register(formData.email, formData.password, formData.fullName, formData.phone)
      
      // Force logout to ensure they go to login page (Supabase auto-logins)
      const { supabase } = await import('../../utils/supabaseClient')
      await supabase.auth.signOut()

      showToast('Đăng ký thành công! Vui lòng đăng nhập.', 'success')
      navigate('/login')
    } catch (error) {
      showToast(error.message || 'Đăng ký thất bại', 'error')
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
          <h1 className="text-3xl font-bold text-slate-900">Tạo tài khoản</h1>
          <p className="text-slate-500 mt-2">Dành cho khách hàng gửi xe</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Họ và tên"
              name="fullName"
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChange={handleChange}
              disabled={loading}
              icon={User}
              required
            />
            <Input
              label="Số điện thoại"
              name="phone"
              placeholder="09xxx..."
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              icon={Phone}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              icon={Mail}
              required
            />
            <Input
              label="Mật khẩu"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              icon={Lock}
              required
            />
            <Input
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              icon={Lock}
              required
            />

            <Button
              type="submit"
              className="w-full py-3 mt-4"
              loading={loading}
            >
              Đăng ký
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-600">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register

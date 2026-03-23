import React, { useEffect, useState } from 'react'
import { Users, UserPlus, Search, Shield, User, Loader2, Phone, Mail, MoreVertical, Lock, Unlock } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { useSupabase } from '../../hooks/useSupabase'
import { supabase } from '../../utils/supabaseClient'
import { ROLES } from '../../utils/constants'
import { useToast } from '../../context/ToastContext'

const UsersPage = () => {
  const [profiles, setProfiles] = useState([])
  const [activeTab, setActiveTab] = useState(ROLES.EMPLOYEE)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    password: 'password123'
  })

  const { query, loading } = useSupabase()
  const { showToast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const { data } = await query((s) => s.from('profiles').select('*').order('created_at', { ascending: false }))
    if (data) setProfiles(data)
  }

  const handleCreateStaff = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.fullName) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error')
      return
    }

    setCreating(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone
        }
      })

      if (error) {
        console.error('Edge Function Error:', error)
        throw new Error(error.message || 'Không thể tạo tài khoản nhân viên')
      }

      showToast('Tạo tài khoản nhân viên thành công!', 'success')
      setIsModalOpen(false)
      setFormData({ email: '', fullName: '', phone: '', password: 'password123' })
      fetchUsers()
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (user) => {
    const newStatus = !user.is_active
    const { error } = await query((s) => 
      s.from('profiles')
        .update({ is_active: newStatus })
        .eq('id', user.id),
      `Đã ${newStatus ? 'kích hoạt lại' : 'hủy kích hoạt'} tài khoản ${user.full_name}`
    )
    if (!error) fetchUsers()
  }

  const filteredUsers = profiles.filter(user => 
    user.role === activeTab &&
    (showInactive || user.is_active) &&
    (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     user.phone?.includes(searchTerm))
  )

  const TabButton = ({ role, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(role)}
      className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-all ${
        activeTab === role 
          ? 'border-primary-600 text-primary-600 bg-primary-50/50' 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h2>
          <p className="text-slate-500">Xem danh sách nhân viên và khách hàng trong hệ thống</p>
        </div>
        {activeTab === ROLES.EMPLOYEE && (
          <Button onClick={() => setIsModalOpen(true)} icon={UserPlus}>
            Thêm nhân viên
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/30">
          <TabButton role={ROLES.EMPLOYEE} label="Nhân viên" icon={Shield} />
          <TabButton role={ROLES.CUSTOMER} label="Khách hàng" icon={User} />
        </div>

        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Tìm kiếm ${activeTab === ROLES.EMPLOYEE ? 'nhân viên' : 'khách hàng'}...`}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end px-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-500 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showInactive} 
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Hiển thị tài khoản đã nghỉ/ngừng hoạt động
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-50">
                  <th className="px-4 py-3">Người dùng</th>
                  <th className="px-4 py-3">Liên hệ</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      Không tìm thấy người dùng nào
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                            {user.full_name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium text-slate-900">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-3.5 h-3.5" />
                          {user.phone || 'Chưa cập nhật'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          user.role === ROLES.ADMIN ? 'bg-purple-100 text-purple-700' :
                          user.role === ROLES.EMPLOYEE ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          user.is_active 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button 
                          onClick={() => handleToggleActive(user)}
                          title={user.is_active ? 'Hủy kích hoạt' : 'Kích hoạt lại'}
                          className={`p-2 rounded-lg transition-all ${
                            user.is_active 
                              ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' 
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {user.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thêm nhân viên mới"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <Input 
            label="Họ và tên" 
            placeholder="Nhập họ tên nhân viên" 
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            required 
          />
          <Input 
            label="Email" 
            type="email" 
            placeholder="nhanvien@company.com" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required 
          />
          <Input 
            label="Số điện thoại" 
            placeholder="09xxx..." 
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required 
          />
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
              <Lock className="w-4 h-4" />
              Mật khẩu mặc định
            </div>
            <p className="text-xs text-amber-700">
              Nhân viên sẽ sử dụng mật khẩu: <code className="bg-white px-1.5 py-0.5 rounded font-bold border border-amber-200">password123</code> để đăng nhập lần đầu.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" className="flex-1" loading={creating}>
              Xác nhận thêm
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default UsersPage

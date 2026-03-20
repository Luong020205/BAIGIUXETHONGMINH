import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Car, Bike, History, Wallet, CheckCircle2, AlertCircle, ArrowRight, Loader2, User, CreditCard, AlertTriangle, Sparkles, MapPin, Clock } from 'lucide-react'
import { useSupabase } from '../../hooks/useSupabase'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../utils/supabaseClient'
import { PARKING_STATUS } from '../../utils/constants'
import { formatCurrency, formatDate } from '../../utils/helpers'

const CustomerHome = () => {
  const [activeSessions, setActiveSessions] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [invoices, setInvoices] = useState([])
  const [monthlyCards, setMonthlyCards] = useState([])
  
  const { profile } = useAuth()
  const { query, loading } = useSupabase()

  useEffect(() => {
    fetchCustomerData()
  }, [])

  const fetchCustomerData = async () => {
    // 1. Fetch products (vehicles) to get all license plates
    const { data: v } = await query((s) => 
      s.from('vehicles').select('*').eq('customer_id', profile?.id)
    )
    if (v) setVehicles(v)
    const plateList = v ? v.map(veh => veh.license_plate) : []

    // 2. Fetch active parking sessions (by ID or Plate)
    const { data: sessions } = await query((s) => 
      s.from('parking_records')
        .select('*, area:parking_areas(code), slot:parking_slots(slot_number)')
        .eq('status', PARKING_STATUS.IN)
        .or(`customer_id.eq.${profile?.id}${plateList.length > 0 ? `,license_plate.in.(${plateList.join(',')})` : ''}`)
    )
    if (sessions) setActiveSessions(sessions)

    // 3. Fetch unpaid invoices
    const { data: inv } = await query((s) => 
      s.from('invoices')
      .select('*, record:parking_records!inner(*)')
      .eq('record.customer_id', profile?.id)
      .eq('payment_status', 'pending')
    )
    if (inv) setInvoices(inv)

    // 4. Fetch active monthly cards
    const { data: cards } = await supabase
      .from('monthly_cards')
      .select('*')
      .eq('customer_id', profile?.id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString().split('T')[0])
    if (cards) setMonthlyCards(cards)
  }

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate)
    const now = new Date()
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-primary-600 flex items-center justify-center text-white shadow-xl shadow-primary-200">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Xin chào, {profile?.full_name || 'Khách hàng'}!</h2>
          <p className="text-slate-500">Chào mừng bạn quay lại hệ thống Smart Parking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Session Card */}
        <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl col-span-1 md:col-span-2">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary-400" />
              Xe đang gửi trong bãi
            </h3>
            
            {activeSessions.length > 0 ? (
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-5 bg-white/5 rounded-[1.5rem] border border-white/10 hover:bg-white/10 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 flex items-center justify-center bg-primary-500/20 rounded-2xl text-primary-400 group-hover:scale-110 transition-transform">
                        {session.vehicle_type === 'car' ? <Car className="w-8 h-8" /> : <Bike className="w-8 h-8" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-black text-2xl tracking-tight italic">{session.license_plate}</p>
                          <span className="px-2 py-0.5 rounded-lg bg-primary-600 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary-900/50">
                            Đang đỗ
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <MapPin className="w-3 h-3 text-red-400" />
                            Vị trí: <span className="text-white ml-1 bg-white/10 px-2 py-0.5 rounded-md border border-white/5">Khu {session.area?.code} - {session.slot?.slot_number}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <Clock className="w-3 h-3 text-blue-400" />
                            Vào: <span className="text-white ml-1">{formatDate(session.entry_time).split(' ')[1]}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link to="/customer/history" className="p-3 bg-white/10 rounded-2xl hover:bg-primary-600 transition-all shadow-xl">
                      <ArrowRight className="w-6 h-6" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                <p className="text-slate-400">Hiện bạn không có xe nào trong bãi</p>
              </div>
            )}
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Phương tiện của tôi</h4>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-black text-slate-900">{vehicles.length}</span>
              <Link to="/customer/vehicles" className="text-primary-600 text-sm font-bold hover:underline">Quản lý</Link>
            </div>
            <div className="mt-4 flex -space-x-2">
              {vehicles.map((v, i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${v.vehicle_type === 'car' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {v.license_plate[0]}
                </div>
              ))}
              {vehicles.length === 0 && <div className="text-xs text-slate-300 italic">Chưa đăng ký xe</div>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Hóa đơn chờ</h4>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-black text-slate-900">{invoices.length}</span>
              <Link to="/customer/invoices" className="text-primary-600 text-sm font-bold hover:underline">Xem tất cả</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Card Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary-600" />
            Thẻ tháng
          </h3>
          <Link to="/customer/monthly-card" className="text-primary-600 text-sm font-bold hover:underline">Quản lý thẻ</Link>
        </div>

        {monthlyCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {monthlyCards.map(card => {
              const daysLeft = getDaysRemaining(card.end_date)
              const isNearExpiry = daysLeft <= 7
              return (
                <Link to="/customer/monthly-card" key={card.id} className="block">
                  <div className={`p-5 rounded-2xl border-2 transition-all hover:shadow-md ${
                    isNearExpiry ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {card.vehicle_type === 'car' ? <Car className="w-5 h-5 text-blue-600" /> : <Bike className="w-5 h-5 text-emerald-600" />}
                        <span className="font-black text-lg italic text-slate-900">{card.license_plate}</span>
                      </div>
                      {isNearExpiry ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                          <AlertTriangle className="w-3 h-3" /> Sắp hết hạn
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Hoạt động
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Hết hạn: {new Date(card.end_date).toLocaleDateString('vi-VN')} • Còn {daysLeft} ngày
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-6 rounded-2xl border border-primary-100 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-primary-900">Chưa có thẻ tháng</h4>
              <p className="text-sm text-primary-700 mt-1">Đăng ký thẻ tháng để gửi xe không cần thanh toán mỗi lần!</p>
            </div>
            <Link to="/customer/monthly-card">
              <button className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-lg shadow-primary-200">
                <Sparkles className="w-4 h-4" />
                Đăng ký
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
         <div className="p-6 bg-blue-50 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
              <History className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-blue-900">Lịch sử minh bạch</h4>
            <p className="text-sm text-blue-700">Tra cứu chính xác thời gian và vị trí xe đã từng gửi tại hệ thống.</p>
         </div>
         <div className="p-6 bg-emerald-50 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
              <Wallet className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-emerald-900">Tiết kiệm chi phí</h4>
            <p className="text-sm text-emerald-700">Đăng ký thẻ tháng để gửi xe không giới hạn, tiết kiệm hơn.</p>
         </div>
         <div className="p-6 bg-purple-50 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-purple-900">Hỗ trợ 24/7</h4>
            <p className="text-sm text-purple-700">Đội ngũ kĩ thuật và an ninh luôn sẵn sàng hỗ trợ bạn mọi lúc.</p>
         </div>
      </div>
    </div>
  )
}

export default CustomerHome

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Car, Bike, History, Wallet, CheckCircle2, AlertCircle, ArrowRight, Loader2, User, MapPin } from 'lucide-react'
import { useSupabase } from '../../hooks/useSupabase'
import { useAuth } from '../../hooks/useAuth'
import { PARKING_STATUS } from '../../utils/constants'
import { formatCurrency, formatDate } from '../../utils/helpers'

const CustomerHome = () => {
  const [activeSessions, setActiveSessions] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [invoices, setInvoices] = useState([])
  const [areas, setAreas] = useState([])
  const [selectedArea, setSelectedArea] = useState(null)
  const [slots, setSlots] = useState([])
  
  const { profile } = useAuth()
  const { query, loading } = useSupabase()

  useEffect(() => {
    fetchCustomerData()
    fetchAreasAndSlots()
  }, [])

  const fetchCustomerData = async () => {
    // Fetch active parking sessions linking by customer_id
    const { data: sessions } = await query((s) => 
      s.from('parking_records')
        .select('*, area:parking_areas(code), slot:parking_slots(slot_number)')
        .eq('customer_id', profile?.id)
        .eq('status', PARKING_STATUS.IN)
    )
    if (sessions) setActiveSessions(sessions)

    // Fetch registered vehicles
    const { data: v } = await query((s) => 
      s.from('vehicles').select('*').eq('customer_id', profile?.id)
    )
    if (v) setVehicles(v)

    // Fetch unpaid invoices
    const { data: inv } = await query((s) => 
      s.from('invoices')
      .select('*, record:parking_records!inner(*)')
      .eq('record.customer_id', profile?.id)
      .eq('payment_status', 'pending')
    )
    if (inv) setInvoices(inv)
  }

  const fetchAreasAndSlots = async () => {
    const { data: a } = await query((s) => s.from('parking_areas').select('*').order('code'))
    if (a) {
      setAreas(a)
      if (a.length > 0) setSelectedArea(a[0].id)
    }
  }

  useEffect(() => {
    if (selectedArea) {
      fetchSlots(selectedArea)
    }
  }, [selectedArea])

  const fetchSlots = async (areaId) => {
    const { data } = await query((s) => 
      s.from('parking_slots')
        .select('*')
        .eq('area_id', areaId)
        .order('slot_number')
    )
    if (data) setSlots(data)
  }

  const handleReserveSlot = async (slot) => {
    if (slot.status !== 'available') return

    const { error } = await query((s) => 
      s.from('parking_slots')
        .update({ status: 'reserved', customer_id: profile?.id })
        .eq('id', slot.id),
      'Đã đặt chỗ thành công! Vui lòng di chuyển đến bãi xe.'
    )
    if (!error) fetchSlots(selectedArea)
  }

  const handleCancelReservation = async (slotId) => {
    const { error } = await query((s) => 
      s.from('parking_slots')
        .update({ status: 'available', customer_id: null })
        .eq('id', slotId),
      'Đã hủy đặt chỗ'
    )
    if (!error) fetchSlots(selectedArea)
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
                  <div key={session.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary-500/20 rounded-xl text-primary-400">
                        {session.vehicle_type === 'car' ? <Car /> : <Bike />}
                      </div>
                      <div>
                        <p className="font-black text-xl italic">{session.license_plate}</p>
                        <p className="text-xs text-slate-400">Khu vực: {session.area?.code} • Vào lúc: {formatDate(session.entry_time).split(' ')[1]}</p>
                      </div>
                    </div>
                    <Link to="/customer/history" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                      <ArrowRight className="w-5 h-5" />
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
          {/* Abstract background blobs */}
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
            <div className="mt-4 p-3 bg-amber-50 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-700">
              <AlertCircle className="w-4 h-4" />
              Tính năng thanh toán trực tuyến sắp ra mắt
            </div>
          </div>
        </div>
      </div>

      {/* Slot Selection Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            Vị trí đỗ xe & Đặt chỗ trước
          </h3>
          <div className="flex gap-2">
            {areas.map(area => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area.id)}
                className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                  selectedArea === area.id 
                    ? 'border-primary-600 bg-primary-50 text-primary-700' 
                    : 'border-slate-100 bg-white text-slate-400'
                }`}
              >
                {area.code}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[300px] flex flex-col items-center justify-center">
          {loading && slots.length === 0 ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <p className="text-sm text-slate-400 font-medium">Đang tải sơ đồ bãi xe...</p>
            </div>
          ) : areas.length === 0 ? (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                <MapPin className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium">Hiện tại không có khu vực nào khả dụng.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 w-full">
                {slots.map(slot => {
                  const isMine = slot.customer_id === profile?.id
                  const statusColors = {
                    available: 'bg-slate-50 border-slate-100 text-slate-400 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600',
                    occupied: 'bg-primary-600 border-primary-600 text-white cursor-not-allowed opacity-80',
                    reserved: isMine 
                      ? 'bg-amber-500 border-amber-500 text-white animate-pulse' 
                      : 'bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed'
                  }

                  return (
                    <button
                      key={slot.id}
                      disabled={(slot.status !== 'available' && !isMine) || loading}
                      onClick={() => isMine ? handleCancelReservation(slot.id) : handleReserveSlot(slot)}
                      className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all ${statusColors[slot.status]}`}
                    >
                      <span className="text-[10px] font-bold opacity-60">S-</span>
                      <span className="text-sm font-black">{slot.slot_number.split('-')[1]}</span>
                      {isMine && slot.status === 'reserved' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                      )}
                    </button>
                  )
                })}
              </div>
              
              <div className="mt-8 flex justify-center gap-6 text-xs font-bold uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-slate-50 border-2 border-slate-100"></div> TRỐNG
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-primary-600"></div> ĐÃ ĐỖ
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-amber-500"></div> BẠN ĐẶT
                </div>
              </div>
            </>
          )}
        </div>
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
            <p className="text-sm text-emerald-700">Giá ưu đãi dành riêng cho khách hàng đăng ký thành viên chính thức.</p>
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

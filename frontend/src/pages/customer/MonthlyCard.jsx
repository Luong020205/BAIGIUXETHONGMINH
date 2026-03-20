import React, { useEffect, useState } from 'react'
import { CreditCard, Car, Bike, Calendar, Clock, AlertTriangle, CheckCircle2, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { supabase } from '../../utils/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { useSupabase } from '../../hooks/useSupabase'
import { useToast } from '../../context/ToastContext'
import { formatCurrency } from '../../utils/helpers'
import { VEHICLE_TYPES } from '../../utils/constants'
import { Button } from '../../components/common/Button'

const MonthlyCard = () => {
  const [cards, setCards] = useState([])
  const [pricing, setPricing] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [isRegistering, setIsRegistering] = useState(false)
  const [formData, setFormData] = useState({
    license_plate: '',
    vehicle_type: VEHICLE_TYPES.MOTORCYCLE
  })

  const { profile } = useAuth()
  const { query, loading } = useSupabase()
  const { showToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // Fetch active monthly cards
    const { data: c } = await supabase
      .from('monthly_cards')
      .select('*')
      .eq('customer_id', profile?.id)
      .order('created_at', { ascending: false })
    if (c) setCards(c)

    // Fetch monthly pricing
    const { data: p } = await supabase.from('monthly_pricing').select('*')
    if (p) setPricing(p)

    // Fetch registered vehicles
    const { data: v } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', profile?.id)
    if (v) setVehicles(v)
  }

  const getPrice = (vehicleType) => {
    const p = pricing.find(pr => pr.vehicle_type === vehicleType)
    return p?.monthly_rate || 0
  }

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return diff
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!formData.license_plate) {
      showToast('Vui lòng nhập biển số xe', 'error')
      return
    }

    // Check if there's already an active card for this plate
    const existingActive = cards.find(
      c => c.license_plate === formData.license_plate && c.status === 'active' && getDaysRemaining(c.end_date) > 0
    )
    if (existingActive) {
      showToast('Biển số này đã có thẻ tháng đang hoạt động', 'error')
      return
    }

    const price = getPrice(formData.vehicle_type)
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    const { error } = await query((s) =>
      s.from('monthly_cards').insert([{
        customer_id: profile?.id,
        license_plate: formData.license_plate.toUpperCase(),
        vehicle_type: formData.vehicle_type,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        price: price,
        status: 'active'
      }]),
      'Đăng ký thẻ tháng thành công!'
    )

    if (!error) {
      setIsRegistering(false)
      setFormData({ license_plate: '', vehicle_type: VEHICLE_TYPES.MOTORCYCLE })
      fetchData()
    }
  }

  const handleRenew = async (card) => {
    const price = getPrice(card.vehicle_type)
    const newStart = new Date()
    const newEnd = new Date()
    newEnd.setMonth(newEnd.getMonth() + 1)

    // Mark old card as expired
    await supabase
      .from('monthly_cards')
      .update({ status: 'expired' })
      .eq('id', card.id)

    // Create new card
    const { error } = await query((s) =>
      s.from('monthly_cards').insert([{
        customer_id: profile?.id,
        license_plate: card.license_plate,
        vehicle_type: card.vehicle_type,
        start_date: newStart.toISOString().split('T')[0],
        end_date: newEnd.toISOString().split('T')[0],
        price: price,
        status: 'active'
      }]),
      'Gia hạn thẻ tháng thành công!'
    )

    if (!error) fetchData()
  }

  // Auto-expire cards that are past end_date
  useEffect(() => {
    cards.forEach(async (card) => {
      if (card.status === 'active' && getDaysRemaining(card.end_date) < 0) {
        await supabase
          .from('monthly_cards')
          .update({ status: 'expired' })
          .eq('id', card.id)
      }
    })
  }, [cards])

  const activeCards = cards.filter(c => c.status === 'active' && getDaysRemaining(c.end_date) >= 0)
  const expiredCards = cards.filter(c => c.status !== 'active' || getDaysRemaining(c.end_date) < 0)

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary-600" />
            Thẻ tháng
          </h2>
          <p className="text-slate-500 mt-1">Quản lý thẻ gửi xe tháng của bạn</p>
        </div>
        {!isRegistering && (
          <Button onClick={() => setIsRegistering(true)} icon={Sparkles}>
            Đăng ký thẻ mới
          </Button>
        )}
      </div>

      {/* Registration Form */}
      {isRegistering && (
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            Đăng ký thẻ tháng mới
          </h3>
          <form onSubmit={handleRegister} className="space-y-6">
            {/* License Plate Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Biển số xe</label>
              {vehicles.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {vehicles.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          license_plate: v.license_plate,
                          vehicle_type: v.vehicle_type
                        })}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          formData.license_plate === v.license_plate
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {v.vehicle_type === 'car' ? <Car className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
                          <span className="font-bold text-sm">{v.license_plate}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">Hoặc nhập biển số mới:</p>
                </div>
              ) : null}
              <input
                type="text"
                placeholder="VD: 30A-12345"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-bold uppercase tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all mt-2"
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Loại xe</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, vehicle_type: VEHICLE_TYPES.MOTORCYCLE })}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    formData.vehicle_type === VEHICLE_TYPES.MOTORCYCLE
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-slate-100 bg-slate-50 text-slate-400'
                  }`}
                >
                  <Bike className="w-8 h-8" />
                  <div>
                    <span className="font-bold text-sm block">Xe máy</span>
                    <span className="text-xs opacity-70">{formatCurrency(getPrice('motorcycle'))}/tháng</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, vehicle_type: VEHICLE_TYPES.CAR })}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    formData.vehicle_type === VEHICLE_TYPES.CAR
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-100 bg-slate-50 text-slate-400'
                  }`}
                >
                  <Car className="w-8 h-8" />
                  <div>
                    <span className="font-bold text-sm block">Ô tô</span>
                    <span className="text-xs opacity-70">{formatCurrency(getPrice('car'))}/tháng</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Price Summary */}
            <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl border border-primary-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Phí thẻ tháng:</span>
                <span className="text-2xl font-black text-primary-600">{formatCurrency(getPrice(formData.vehicle_type))}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Hiệu lực 30 ngày kể từ ngày đăng ký</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => { setIsRegistering(false); setFormData({ license_plate: '', vehicle_type: VEHICLE_TYPES.MOTORCYCLE }) }}
              >
                Hủy
              </Button>
              <Button type="submit" className="flex-[2]" loading={loading} icon={CheckCircle2}>
                Xác nhận đăng ký
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Active Cards */}
      {activeCards.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Thẻ đang hoạt động</h3>
          {activeCards.map(card => {
            const daysLeft = getDaysRemaining(card.end_date)
            const isNearExpiry = daysLeft <= 7 && daysLeft >= 0
            return (
              <div key={card.id} className="relative overflow-hidden">
                {/* Expiration Warning */}
                {isNearExpiry && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-t-2xl flex items-center gap-2 text-sm font-medium animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                    Thẻ sắp hết hạn! Còn {daysLeft} ngày. Hãy gia hạn để tiếp tục sử dụng.
                  </div>
                )}
                
                <div className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 shadow-2xl relative overflow-hidden ${isNearExpiry ? 'rounded-b-[2rem]' : 'rounded-[2rem]'}`}>
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
                  
                  <div className="relative z-10">
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">THẺ GỬI XE THÁNG</p>
                          <p className="text-xs text-slate-500">Smart Parking Pro</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isNearExpiry 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {isNearExpiry ? 'Sắp hết hạn' : 'Đang hoạt động'}
                      </div>
                    </div>

                    {/* License Plate */}
                    <div className="mb-8">
                      <p className="text-xs text-slate-400 mb-1">Biển số xe</p>
                      <p className="text-3xl font-black italic tracking-wider">{card.license_plate}</p>
                    </div>

                    {/* Card Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Loại xe</p>
                        <div className="flex items-center gap-1.5">
                          {card.vehicle_type === 'car' ? <Car className="w-4 h-4 text-blue-400" /> : <Bike className="w-4 h-4 text-emerald-400" />}
                          <span className="font-bold text-sm">{card.vehicle_type === 'car' ? 'Ô tô' : 'Xe máy'}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Ngày bắt đầu</p>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-primary-400" />
                          <span className="font-bold text-sm">{new Date(card.start_date).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Ngày hết hạn</p>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-amber-400" />
                          <span className="font-bold text-sm">{new Date(card.end_date).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Còn lại</p>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-primary-400" />
                          <span className={`font-bold text-sm ${isNearExpiry ? 'text-amber-400' : 'text-white'}`}>{daysLeft} ngày</span>
                        </div>
                      </div>
                    </div>

                    {/* Renew Button */}
                    {isNearExpiry && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <Button
                          onClick={() => handleRenew(card)}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-600"
                          icon={RefreshCw}
                          loading={loading}
                        >
                          Gia hạn thẻ tháng ({formatCurrency(getPrice(card.vehicle_type))})
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && activeCards.length === 0 && !isRegistering && (
        <div className="bg-white p-12 rounded-[2rem] border border-slate-100 shadow-sm text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
            <CreditCard className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Chưa có thẻ tháng</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Đăng ký thẻ tháng để gửi xe không cần thanh toán mỗi lần. Tiện lợi và tiết kiệm hơn!
          </p>
          <Button onClick={() => setIsRegistering(true)} icon={Sparkles} className="mx-auto">
            Đăng ký ngay
          </Button>
        </div>
      )}

      {/* Expired Cards */}
      {expiredCards.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-500">Thẻ đã hết hạn</h3>
          <div className="space-y-3">
            {expiredCards.slice(0, 5).map(card => (
              <div key={card.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-200 rounded-xl">
                    {card.vehicle_type === 'car' ? <Car className="w-5 h-5 text-slate-400" /> : <Bike className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">{card.license_plate}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(card.start_date).toLocaleDateString('vi-VN')} - {new Date(card.end_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-500">
                  Hết hạn
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Info */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-6 rounded-2xl border border-primary-100">
        <h4 className="font-bold text-primary-900 mb-3">Bảng giá thẻ tháng</h4>
        <div className="grid grid-cols-2 gap-4">
          {pricing.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                {p.vehicle_type === 'car' ? <Car className="w-5 h-5 text-blue-600" /> : <Bike className="w-5 h-5 text-emerald-600" />}
                <span className="font-bold text-slate-700">{p.vehicle_type === 'car' ? 'Ô tô' : 'Xe máy'}</span>
              </div>
              <p className="text-xl font-black text-primary-600">{formatCurrency(p.monthly_rate)}<span className="text-xs font-normal text-slate-400">/tháng</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MonthlyCard

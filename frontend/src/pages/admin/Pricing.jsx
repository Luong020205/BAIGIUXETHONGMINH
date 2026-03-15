import React, { useEffect, useState } from 'react'
import { Banknote, Save, Loader2, Car, Bike, History } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { useSupabase } from '../../hooks/useSupabase'
import { formatCurrency } from '../../utils/helpers'

const Pricing = () => {
  const [pricingData, setPricingData] = useState([])
  const { query, loading } = useSupabase()

  useEffect(() => {
    fetchPricing()
  }, [])

  const fetchPricing = async () => {
    const { data } = await query((s) => s.from('pricing').select('*'))
    if (data) setPricingData(data)
  }

  const handleRateChange = (id, newRate) => {
    setPricingData(prev => prev.map(item => 
      item.id === id ? { ...item, hourly_rate: parseInt(newRate) || 0 } : item
    ))
  }

  const handleSave = async (item) => {
    await query((s) => 
      s.from('pricing')
        .update({ hourly_rate: item.hourly_rate, effective_from: new Date().toISOString() })
        .eq('id', item.id),
      `Cập nhật giá cho ${item.vehicle_type === 'car' ? 'Ô tô' : 'Xe máy'} thành công`
    )
    fetchPricing()
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Thiết lập bảng giá</h2>
        <p className="text-slate-500">Cập nhật đơn giá gửi xe theo giờ cho từng loại phương tiện</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {pricingData.map((item) => (
          <div key={item.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-50 relative overflow-hidden group">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              {item.vehicle_type === 'car' ? <Car size={120} /> : <Bike size={120} />}
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${item.vehicle_type === 'car' ? 'bg-blue-600' : 'bg-emerald-500'} text-white shadow-lg`}>
                  {item.vehicle_type === 'car' ? <Car className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 leading-tight">
                    {item.vehicle_type === 'car' ? 'Ô tô' : 'Xe máy'}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Đơn giá hiện tại</p>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="text-3xl font-black text-primary-600">
                  {formatCurrency(item.hourly_rate)}
                  <span className="text-sm font-medium text-slate-400 ml-1">/giờ</span>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  label="Điền giá mới (VNĐ)"
                  type="number"
                  placeholder="Ví dụ: 25000"
                  value={item.hourly_rate}
                  onChange={(e) => handleRateChange(item.id, e.target.value)}
                />
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <History className="w-3 h-3" />
                  Áp dụng từ: {item.effective_from || 'Bây giờ'}
                </p>
              </div>

              <Button 
                onClick={() => handleSave(item)}
                className="w-full"
                icon={Save}
                loading={loading}
              >
                Cập nhật giá
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4 items-start">
        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
          <Banknote className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h5 className="text-sm font-semibold text-blue-900">Lưu ý về bảng giá</h5>
          <p className="text-sm text-blue-700 leading-relaxed">
            Thay đổi giá sẽ áp dụng cho tất cả các xe vào bãi từ thời điểm hiện tại. 
            Các xe đang trong bãi vẫn sẽ được tính theo giá cũ tại thời điểm vào (hoặc theo chính sách hệ thống).
          </p>
        </div>
      </div>
    </div>
  )
}

export default Pricing

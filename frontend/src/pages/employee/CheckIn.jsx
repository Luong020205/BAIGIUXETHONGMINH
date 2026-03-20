import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Car, Bike, MapPin, Search, ArrowRight, Loader2, User, Scan } from 'lucide-react'
import { supabase } from '../../utils/supabaseClient'
import { useSupabase } from '../../hooks/useSupabase'
import { useAuth } from '../../hooks/useAuth'
import { VEHICLE_TYPES, PARKING_STATUS } from '../../utils/constants'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { useToast } from '../../context/ToastContext'
import { Scanner } from '../../components/common/Scanner'

const CheckIn = () => {
  const [licensePlate, setLicensePlate] = useState('')
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES.CAR)
  const [areas, setAreas] = useState([])
  const [selectedArea, setSelectedArea] = useState('')
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [customer, setCustomer] = useState(null)
  const [searchingCustomer, setSearchingCustomer] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  const { profile } = useAuth()
  const { query, loading } = useSupabase()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchAreas()
  }, [])

  const fetchAreas = async () => {
    const { data } = await query((s) => 
      s.from('parking_areas')
        .select('*')
        .order('code')
    )
    if (data) {
      setAreas(data)
      // Auto-select first matching area if none selected
      if (!selectedArea) {
        const firstMatching = data.find(a => a.vehicle_type === vehicleType && a.current_count < a.capacity)
        if (firstMatching) setSelectedArea(firstMatching.id)
      }
    }
  }

  useEffect(() => {
    if (selectedArea) {
      setSelectedSlot('')
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

  const handlePlateChange = async (e) => {
    const value = e.target.value.toUpperCase()
    setLicensePlate(value)

    if (value.length >= 4) {
      setSearchingCustomer(true)
      // Check if this plate belongs to a registered customer
      const { data } = await supabase
        .from('vehicles')
        .select('*, profiles(id, full_name, phone)')
        .eq('license_plate', value)
        .single()
      
      if (data) {
        setCustomer(data.profiles)
        setVehicleType(data.vehicle_type)
        
        // Auto-detect profile but skip reservation checks
        if (data) {
          setCustomer(data.profiles)
          setVehicleType(data.vehicle_type)
        }
      } else {
        setCustomer(null)
      }
      setSearchingCustomer(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!licensePlate || !selectedArea || !selectedSlot) {
      return showToast('Vui lòng nhập biển số và chọn vị trí đỗ (Slot)', 'error')
    }

    const { error } = await query((s) => 
      s.from('parking_records').insert([{
        license_plate: licensePlate,
        vehicle_type: vehicleType,
        area_id: selectedArea,
        slot_id: selectedSlot,
        status: PARKING_STATUS.IN,
        customer_id: customer?.id || null,
        created_by: profile.id
      }]),
      'Ghi nhận xe vào thành công!'
    )

    if (!error) {
      navigate('/employee')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-900 italic">NHẬN XE VÀO BÃI</h2>
        <p className="text-slate-500 mt-2">Nhập thông tin phương tiện để bắt đầu lượt gửi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        {/* Left Form */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  label="Biển số xe"
                  placeholder="30A-12345"
                  className="text-2xl font-black tracking-widest text-center uppercase py-4"
                  value={licensePlate}
                  onChange={handlePlateChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="absolute right-3 top-[34px] p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200"
                  title="Quét camera"
                >
                  <Scan className="w-5 h-5" />
                </button>
                {searchingCustomer && (
                  <div className="absolute right-14 top-[38px]">
                    <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
                  </div>
                )}
              </div>

              {/* Vehicle Type Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setVehicleType(VEHICLE_TYPES.CAR)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    vehicleType === VEHICLE_TYPES.CAR 
                      ? 'border-primary-600 bg-primary-50 text-primary-700' 
                      : 'border-slate-100 bg-slate-50 text-slate-400 grayscale'
                  }`}
                >
                  <Car className="w-8 h-8" />
                  <span className="font-bold text-sm">Ô TÔ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVehicleType(VEHICLE_TYPES.MOTORCYCLE)
                    // Reset area if current one is incompatible
                    const currentArea = areas.find(a => a.id === selectedArea)
                    if (currentArea && currentArea.vehicle_type !== VEHICLE_TYPES.MOTORCYCLE) {
                      setSelectedArea('')
                      setSlots([])
                    }
                  }}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    vehicleType === VEHICLE_TYPES.MOTORCYCLE 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                      : 'border-slate-100 bg-slate-50 text-slate-400 grayscale'
                  }`}
                >
                  <Bike className="w-8 h-8" />
                  <span className="font-bold text-sm">XE MÁY</span>
                </button>
              </div>

              {/* Area Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 ml-1">Chọn Khu vực</label>
                <div className="flex flex-wrap gap-2">
                  {areas.map((area) => {
                    const isCompatible = area.vehicle_type === vehicleType
                    return (
                      <button
                        key={area.id}
                        type="button"
                        disabled={!isCompatible}
                        onClick={() => setSelectedArea(area.id)}
                        className={`px-4 py-2 rounded-xl border-2 font-bold transition-all ${
                          selectedArea === area.id
                            ? 'border-primary-600 bg-primary-50 text-primary-600 shadow-sm'
                            : !isCompatible
                            ? 'border-slate-50 bg-slate-50 text-slate-300 cursor-not-allowed opacity-60'
                            : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        Khu {area.code} 
                        <span className="ml-2 text-[10px] opacity-60">
                          ({isCompatible ? `${area.current_count}/${area.capacity}` : (area.vehicle_type === 'car' ? 'Ô tô' : 'Xe máy')})
                        </span>
                      </button>
                    )
                  })}
                </div>
                {/* Warning if area not compatible with vehicle type */}
                {selectedArea && areas.find(a => a.id === selectedArea)?.vehicle_type !== vehicleType && (
                  <p className="mt-2 text-xs text-red-500 font-medium animate-pulse">
                    Khu vực này không dành cho loại xe đang chọn!
                  </p>
                )}
              </div>

              {/* Slot Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 ml-1">Chọn vị trí (Slot)</label>
                <div className="grid grid-cols-5 gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 max-h-[200px] overflow-y-auto">
                  {slots.map((slot) => {
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={slot.status !== 'available'}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                          selectedSlot === slot.id 
                            ? 'border-primary-600 bg-primary-600 text-white shadow-md' 
                            : slot.status !== 'available'
                              ? 'bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-white border-white text-slate-400 hover:border-primary-200 hover:text-primary-600'
                        }`}
                      >
                        <span className="text-[9px] font-black">{slot.slot_number.split('-')[1]}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-4 text-[10px] font-bold text-slate-400 justify-center">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white border border-slate-200"></div>Trống</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200"></div>Đỗ</div>
                </div>
              </div>
            </div>

            <Button 
              className="w-full py-4 text-lg font-black uppercase tracking-widest rounded-2xl" 
              onClick={handleSubmit}
              loading={loading}
              icon={ArrowRight}
            >
              Ghi nhận xe vào
            </Button>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-400" />
              Thông tin khách hàng
            </h3>
            
            {customer ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Chủ xe</p>
                  <p className="text-lg font-bold">{customer.full_name}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Liên hệ</p>
                  <p className="text-lg font-bold">{customer.phone}</p>
                </div>
                <div className="flex items-center gap-2 p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 text-xs font-bold uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  Thành viên thân thiết
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <Search className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-400 text-sm italic">
                  Chưa tìm thấy khách hàng đăng ký trước cho biển số này.
                </p>
              </div>
            )}
            
            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="flex items-center gap-2 text-primary-400 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Vị trí hiện tại</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                Cổng chính - Luồng 01. Nhân viên đang trực: <span className="text-white font-bold">{profile.full_name}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Scanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(plate) => {
          handlePlateChange({ target: { value: plate } })
        }}
      />
    </div>
  )
}

export default CheckIn

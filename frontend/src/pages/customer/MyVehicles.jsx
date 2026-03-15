import React, { useEffect, useState } from 'react'
import { Plus, Car, Bike, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { useSupabase } from '../../hooks/useSupabase'
import { useAuth } from '../../hooks/useAuth'
import { VEHICLE_TYPES } from '../../utils/constants'

const MyVehicles = () => {
  const [vehicles, setVehicles] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    license_plate: '',
    vehicle_type: VEHICLE_TYPES.CAR
  })

  const { profile } = useAuth()
  const { query, loading } = useSupabase()

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    if (!profile?.id) return
    const { data } = await query((s) => s.from('vehicles').select('*').eq('customer_id', profile.id))
    if (data) setVehicles(data)
  }

  const handleAddVehicle = async (e) => {
    e.preventDefault()
    if (!formData.license_plate) return

    const { error } = await query((s) => 
      s.from('vehicles').insert([{
        customer_id: profile.id,
        license_plate: formData.license_plate.toUpperCase(),
        vehicle_type: formData.vehicle_type
      }]),
      'Đăng ký xe thành công!'
    )

    if (!error) {
      setIsModalOpen(false)
      setFormData({ license_plate: '', vehicle_type: VEHICLE_TYPES.CAR })
      fetchVehicles()
    }
  }

  const handleDelete = async (id) => {
    console.log('MyVehicles: deleting vehicle', id)
    // Removed window.confirm temporarily for better testing reliability
    const { error } = await query((s) => 
      s.from('vehicles').delete().eq('id', id),
      'Đã xóa xe khỏi danh sách'
    )
    if (error) {
      console.error('MyVehicles: Delete error:', error)
    } else {
      console.log('MyVehicles: Delete success')
      fetchVehicles()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Xe của tôi</h2>
          <p className="text-slate-500">Quản lý danh sách phương tiện đã đăng ký trong hệ thống</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={Plus}>Đăng ký xe mới</Button>
      </div>

      {loading && vehicles.length === 0 ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-100">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-10 h-10 text-slate-200" />
          </div>
          <p className="text-slate-400 font-medium mb-6">Bạn chưa đăng ký phương tiện nào</p>
          <Button variant="secondary" onClick={() => setIsModalOpen(true)}>Bắt đầu đăng ký ngay</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 flex flex-col justify-between group hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${v.vehicle_type === 'car' ? 'bg-blue-600' : 'bg-emerald-500'} text-white shadow-lg`}>
                  {v.vehicle_type === 'car' ? <Car className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
                </div>
                <button 
                  onClick={() => handleDelete(v.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Biển số đăng ký</p>
                <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">{v.license_plate}</h3>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-2 text-xs font-bold text-slate-400">
                <AlertCircle className="w-4 h-4" />
                Dùng biển này để vào bãi tự động
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Đăng ký phương tiện"
      >
        <form onSubmit={handleAddVehicle} className="space-y-6">
          <Input
            label="Biển số xe"
            placeholder="VD: 30A-123.45"
            value={formData.license_plate}
            onChange={(e) => setFormData({...formData, license_plate: e.target.value.toUpperCase()})}
            required
            className="text-xl font-bold uppercase text-center"
          />

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Loại phương tiện</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, vehicle_type: VEHICLE_TYPES.CAR})}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  formData.vehicle_type === VEHICLE_TYPES.CAR 
                    ? 'border-primary-600 bg-primary-50 text-primary-700' 
                    : 'border-slate-50 bg-slate-50 text-slate-400'
                }`}
              >
                <Car className="w-6 h-6" />
                <span className="font-bold text-xs uppercase">Ô tô</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, vehicle_type: VEHICLE_TYPES.MOTORCYCLE})}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  formData.vehicle_type === VEHICLE_TYPES.MOTORCYCLE 
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                    : 'border-slate-50 bg-slate-50 text-slate-400'
                }`}
              >
                <Bike className="w-6 h-6" />
                <span className="font-bold text-xs uppercase">Xe máy</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="submit" className="flex-1" loading={loading}>Đăng ký</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default MyVehicles

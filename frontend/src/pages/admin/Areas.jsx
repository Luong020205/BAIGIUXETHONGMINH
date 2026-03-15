import React, { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Search, MapPin, Car, Bike, Loader2 } from 'lucide-react'
import { supabase } from '../../utils/supabaseClient'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { useToast } from '../../context/ToastContext'
import { useSupabase } from '../../hooks/useSupabase'
import { VEHICLE_TYPES } from '../../utils/constants'

const Areas = () => {
  const [areas, setAreas] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingArea, setEditingArea] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    vehicle_type: VEHICLE_TYPES.CAR,
    capacity: 0
  })

  const { query, loading } = useSupabase()
  const { showToast } = useToast()

  useEffect(() => {
    fetchAreas()
  }, [])

  const fetchAreas = async () => {
    const { data } = await query((s) => s.from('parking_areas').select('*').order('code'))
    if (data) setAreas(data)
  }

  const handleOpenModal = (area = null) => {
    if (area) {
      setEditingArea(area)
      setFormData({
        code: area.code,
        vehicle_type: area.vehicle_type,
        capacity: area.capacity
      })
    } else {
      setEditingArea(null)
      setFormData({
        code: '',
        vehicle_type: VEHICLE_TYPES.CAR,
        capacity: 0
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.code || formData.capacity <= 0) {
      return showToast('Vui lòng nhập đầy đủ thông tin', 'error')
    }

    if (editingArea) {
      const { error } = await query((s) => 
        s.from('parking_areas').update(formData).eq('id', editingArea.id),
        'Cập nhật khu vực thành công'
      )
      if (!error) {
        setIsModalOpen(false)
        fetchAreas()
      }
    } else {
      const { error } = await query((s) => 
        s.from('parking_areas').insert([formData]),
        'Thêm khu vực thành công'
      )
      if (!error) {
        setIsModalOpen(false)
        fetchAreas()
      }
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khu vực này?')) {
      const { error } = await query((s) => 
        s.from('parking_areas').delete().eq('id', id),
        'Xóa khu vực thành công'
      )
      if (!error) fetchAreas()
    }
  }

  const filteredAreas = areas.filter(area => 
    area.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quản lý khu vực đỗ</h2>
          <p className="text-slate-500">Thêm, sửa hoặc xóa các khu vực trong bãi xe</p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={Plus}>
          Thêm khu vực
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-50 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm mã khu vực..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table grid */}
      {loading && areas.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAreas.map((area) => (
            <div key={area.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${area.vehicle_type === 'car' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {area.vehicle_type === 'car' ? <Car className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 leading-none">{area.code}</h4>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      {area.vehicle_type === 'car' ? 'Ô tô' : 'Xe máy'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenModal(area)}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(area.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tình trạng:</span>
                  <span className="font-semibold text-slate-900">{area.current_count}/{area.capacity}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={twMerge(
                      "h-full rounded-full transition-all duration-500",
                      (area.current_count / area.capacity) > 0.9 ? 'bg-red-500' : 'bg-primary-500'
                    )}
                    style={{ width: `${(area.current_count / area.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Area Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingArea ? 'Cập nhật khu vực' : 'Thêm khu vực mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mã khu vực"
            placeholder="Ví dụ: A1, B2,..."
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Loại phương tiện</label>
            <select
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              value={formData.vehicle_type}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
            >
              <option value={VEHICLE_TYPES.CAR}>Ô tô</option>
              <option value={VEHICLE_TYPES.MOTORCYCLE}>Xe máy</option>
            </select>
          </div>
          <Input
            label="Sức chứa (số chỗ)"
            type="number"
            min="1"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
            required
          />
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              className="flex-1" 
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              {editingArea ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function twMerge(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default Areas

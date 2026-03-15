import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Car, Bike, MapPin, CheckCircle2, LogOut, Loader2, RefreshCw } from 'lucide-react'
import { useSupabase } from '../../hooks/useSupabase'

const AreaCard = ({ area }) => {
  const isFull = area.current_count >= area.capacity
  const occupancy = (area.current_count / area.capacity) * 100

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 flex flex-col justify-between hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${area.vehicle_type === 'car' ? 'bg-blue-600' : 'bg-emerald-500'} text-white shadow-lg`}>
            {area.vehicle_type === 'car' ? <Car className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900 leading-tight">{area.code}</h4>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              {area.vehicle_type === 'car' ? 'Ô tô' : 'Xe máy'}
            </span>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${isFull ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {isFull ? 'Hết chỗ' : 'Còn chỗ'}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="text-sm">
            <p className="text-slate-400 font-medium">Hiện có</p>
            <p className="text-2xl font-black text-slate-900">{area.current_count}</p>
          </div>
          <div className="text-sm text-right">
            <p className="text-slate-400 font-medium">Sức chứa</p>
            <p className="text-lg font-bold text-slate-700">{area.capacity}</p>
          </div>
        </div>

        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${occupancy > 90 ? 'bg-red-500' : occupancy > 70 ? 'bg-amber-500' : 'bg-primary-500'}`} 
            style={{ width: `${occupancy}%` }}
          ></div>
        </div>
        
        <p className="text-[10px] text-slate-400 font-medium text-center italic">
          Đã sử dụng {Math.round(occupancy)}% diện tích
        </p>
      </div>
    </div>
  )
}

const EmployeeHome = () => {
  const [areas, setAreas] = useState([])
  const { query, loading } = useSupabase()

  useEffect(() => {
    fetchAreas()
  }, [])

  const fetchAreas = async () => {
    const { data } = await query((s) => s.from('parking_areas').select('*').order('code'))
    if (data) setAreas(data)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sơ đồ bãi xe</h2>
          <p className="text-slate-500">Giám sát tình trạng chỗ trống theo thời gian thực</p>
        </div>
        <div className="flex gap-3">
          <Link to="/employee/check-in" className="flex-1 sm:flex-none">
            <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 active:scale-95 transition-all">
              <CheckCircle2 className="w-5 h-5" />
              Nhận xe mới
            </button>
          </Link>
          <button 
            onClick={fetchAreas}
            className="p-3 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:text-primary-600 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && areas.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {areas.map((area) => (
            <AreaCard key={area.id} area={area} />
          ))}
        </div>
      )}

      {/* Quick Actions Footer */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-xl font-bold mb-2">Thao tác nhanh</h3>
            <p className="text-slate-400 text-sm max-w-md">Lựa chọn chức năng bạn cần thực hiện ngay bây giờ để quản lý phương tiện ra vào bãi.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/employee/check-out" className="flex items-center gap-3 px-6 py-4 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition-all border border-white/10 group">
              <LogOut className="w-6 h-6 text-primary-400" />
              <div className="text-left">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Bước 2</p>
                <p className="font-bold">Trả xe & Tính tiền</p>
              </div>
            </Link>
            <Link to="/employee/vehicles" className="flex items-center gap-3 px-6 py-4 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition-all border border-white/10 group">
              <RefreshCw className="w-6 h-6 text-emerald-400" />
              <div className="text-left">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Danh sách</p>
                <p className="font-bold">Xe đang trong bãi</p>
              </div>
            </Link>
          </div>
        </div>
        {/* Abstract background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
      </div>
    </div>
  )
}

export default EmployeeHome

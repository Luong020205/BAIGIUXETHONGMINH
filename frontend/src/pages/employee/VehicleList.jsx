import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Clock, Car, Bike, LogOut, Loader2, Filter, ChevronRight } from 'lucide-react'
import { useSupabase } from '../../hooks/useSupabase'
import { PARKING_STATUS } from '../../utils/constants'
import { formatDate } from '../../utils/helpers'

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterArea, setFilterArea] = useState('all')
  const [areas, setAreas] = useState([])

  const { query, loading } = useSupabase()

  useEffect(() => {
    fetchVehicles()
    fetchAreas()
  }, [])

  const fetchVehicles = async () => {
    const { data } = await query((s) => 
      s.from('parking_records')
        .select('*, area:parking_areas(code)')
        .eq('status', PARKING_STATUS.IN)
        .order('entry_time', { ascending: false })
    )
    if (data) setVehicles(data)
  }

  const fetchAreas = async () => {
    const { data } = await query((s) => s.from('parking_areas').select('id, code'))
    if (data) setAreas(data)
  }

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesArea = filterArea === 'all' || v.area_id === filterArea
    return matchesSearch && matchesArea
  })

  // Calculate duration string
  const getDuration = (entryTime) => {
    const diffMs = new Date() - new Date(entryTime)
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHrs}h ${diffMins}m`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Xe đang trong bãi</h2>
          <p className="text-slate-500">Danh sách phương tiện chưa thanh toán và đang đỗ</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          {vehicles.length} phương tiện
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm biển số xe..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-100 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none font-medium text-slate-600"
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
          >
            <option value="all">Tất cả khu vực</option>
            {areas.map(a => (
              <option key={a.id} value={a.id}>{a.code}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={fetchVehicles}
          className="bg-slate-50 text-slate-600 font-bold py-3 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all"
        >
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">Không tìm thấy phương tiện nào khớp với bộ lọc</p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 hover:shadow-xl hover:scale-[1.02] transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${vehicle.vehicle_type === 'car' ? 'bg-blue-600' : 'bg-emerald-500'} text-white shadow-lg`}>
                  {vehicle.vehicle_type === 'car' ? <Car className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Thời lượng đỗ</p>
                  <p className="text-xl font-black text-slate-900 flex items-center gap-2 justify-end">
                    <Clock className="w-4 h-4 text-primary-500" />
                    {getDuration(vehicle.entry_time)}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Biển số</p>
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary-600 transition-colors uppercase italic">{vehicle.license_plate}</h3>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-600">Khu vực: {vehicle.area?.code}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{formatDate(vehicle.entry_time).split(' ')[1]}</span>
                </div>
              </div>

              <Link to={`/employee/check-out?plate=${vehicle.license_plate}`}>
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-primary-600 transition-all">
                  Trả xe
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default VehicleList

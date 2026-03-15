import React, { useEffect, useState } from 'react'
import { Search, Filter, Calendar, Car, Bike, ArrowUpDown, Loader2, User } from 'lucide-react'
import { supabase } from '../../utils/supabaseClient'
import { formatDate } from '../../utils/helpers'
import { useSupabase } from '../../hooks/useSupabase'

const History = () => {
  const [records, setRecords] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const { query, loading } = useSupabase()

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    const { data } = await query((s) => 
      s.from('parking_records')
        .select(`
          *,
          area:parking_areas(code),
          staff:profiles!parking_records_created_by_fkey(full_name),
          customer:profiles!parking_records_customer_id_fkey(full_name)
        `)
        .order('entry_time', { ascending: false })
    )
    if (data) setRecords(data)
  }

  const filteredRecords = records.filter(record => 
    record.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Lịch sử bãi gửi xe</h2>
        <p className="text-slate-500">Tra cứu thông tin xe đã và đang gửi trong hệ thống</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo biển số xe..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
            <Calendar className="w-4 h-4" />
            Tất cả thời gian
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
            <Filter className="w-4 h-4" />
            Lọc
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Biển số / Loại xe</th>
                <th className="px-6 py-4">Khu vực</th>
                <th className="px-6 py-4">Thời gian vào</th>
                <th className="px-6 py-4">Thời gian ra</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Nhân viên / Khách</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-400">
                    Không tìm thấy dữ liệu nào
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${record.vehicle_type === 'car' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {record.vehicle_type === 'car' ? <Car className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{record.license_plate}</p>
                          <p className="text-[10px] uppercase font-bold text-slate-400">{record.vehicle_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {record.area?.code || '--'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(record.entry_time)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {record.exit_time ? formatDate(record.exit_time) : '--'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        record.status === 'in' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {record.status === 'in' ? 'Trong bãi' : 'Đã ra'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <User className="w-3 h-3" />
                          <span>NV: {record.staff?.full_name || 'Admin'}</span>
                        </div>
                        {record.customer && (
                          <div className="flex items-center gap-1.5 text-xs text-primary-600">
                            <User className="w-3 h-3" />
                            <span>KH: {record.customer.full_name}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default History

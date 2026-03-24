import React, { useEffect, useState } from 'react'
import { History, Calendar, Car, Bike, MapPin, Clock, Loader2, Filter, ShieldCheck } from 'lucide-react'
import { supabase } from '../../utils/supabaseClient'
import { formatDate } from '../../utils/helpers'
import { useSupabase } from '../../hooks/useSupabase'
import { useAuth } from '../../hooks/useAuth'

const MyHistory = () => {
  const [records, setRecords] = useState([])
  const { profile } = useAuth()
  const { query, loading } = useSupabase()

  useEffect(() => {
    fetchMyHistory()
  }, [])

  const fetchMyHistory = async () => {
    // Fetch parking history specifically for this customer
    if (!profile?.id) { // Add null check for profile.id
      return;
    }
    const { data } = await query((s) => 
      s.from('parking_records')
        .select('*, area:parking_areas(code)')
        .eq('customer_id', profile.id) // profile.id is safe here due to the guard clause
        .order('entry_time', { ascending: false })
    )
    if (data) setRecords(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Lịch sử gửi xe</h2>
          <p className="text-slate-500">Xem lại hành trình gửi xe của bạn tại hệ thống</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-100 text-slate-600 font-bold hover:bg-slate-50 transition-all text-sm">
          <Calendar className="w-4 h-4" />
          Tháng này
        </button>
      </div>

      {loading && records.length === 0 ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-100">
          <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Bạn chưa có lịch sử gửi xe nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${record.vehicle_type === 'car' ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'}`}>
                {record.vehicle_type === 'car' ? <Car className="w-7 h-7" /> : <Bike className="w-7 h-7" />}
              </div>
              
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Phương tiện</p>
                  <p className="font-bold text-slate-900 italic uppercase">{record.license_plate}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Vị trí</p>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <MapPin className="w-3 h-3 text-primary-500" />
                    {record.area?.code}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Thời gian vào</p>
                  <p className="text-xs font-semibold text-slate-600">{formatDate(record.entry_time)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Trạng thái</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${record.status === 'in' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {record.status === 'in' ? 'Đang trong bãi' : 'Đã ra'}
                  </span>
                  {record.status === 'in' && record.verification_code && (
                    <div className="mt-2 flex items-center gap-1.5 text-primary-600 bg-primary-50 px-2 py-1 rounded-lg border border-primary-100 w-fit">
                      <ShieldCheck className="w-3 h-3" />
                      <span className="text-[10px] font-black tracking-widest uppercase">OTP: {record.verification_code}</span>
                    </div>
                  )}
                </div>
              </div>

              {record.exit_time && (
                <div className="pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-50 md:pl-6 text-right shrink-0">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Đã rời bãi lúc</p>
                  <p className="text-xs font-bold text-slate-700">{formatDate(record.exit_time).split(' ')[1]}</p>
                  <p className="text-[10px] font-medium text-emerald-600 mt-1">Giao dịch thành công</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyHistory

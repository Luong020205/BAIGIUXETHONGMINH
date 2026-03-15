import React, { useState } from 'react'
import { Search, Calendar, History, Car, Bike, Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '../../utils/supabaseClient'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { useSupabase } from '../../hooks/useSupabase'
import { Input } from '../../components/common/Input'
import { Button } from '../../components/common/Button'

const SearchHistory = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  
  const { query, loading } = useSupabase()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchTerm) return

    setHasSearched(true)
    const { data } = await query((s) => 
      s.from('parking_records')
        .select('*, area:parking_areas(code), invoice:invoices(amount)')
        .eq('license_plate', searchTerm.toUpperCase())
        .order('entry_time', { ascending: false })
    )
    if (data) setResults(data)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="max-w-xl">
        <h2 className="text-2xl font-bold text-slate-900">Tra cứu lịch sử</h2>
        <p className="text-slate-500">Tìm kiếm tất cả các lượt gửi xe trước đây theo biển số</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-50 max-w-2xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Nhập biển số xe (VD: 30A-123.45)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              className="text-lg font-bold"
            />
          </div>
          <div className="sm:pt-7">
            <Button type="submit" className="w-full sm:w-auto px-8" loading={loading} icon={Search}>
              Tìm kiếm
            </Button>
          </div>
        </form>
      </div>

      {hasSearched && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs">
            <History className="w-4 h-4" />
            Kết quả tìm kiếm ({results.length})
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
            </div>
          ) : results.length === 0 ? (
            <div className="bg-slate-50 rounded-3xl p-12 text-center border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">Không tìm thấy lịch sử cho biển số này</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((record) => (
                <div key={record.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${record.vehicle_type === 'car' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {record.vehicle_type === 'car' ? <Car className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{record.license_plate}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{record.area?.code}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${record.status === 'in' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {record.status === 'in' ? 'Trong bãi' : 'Đã ra'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Thời gian vào</p>
                      <p className="text-xs font-medium text-slate-700">{formatDate(record.entry_time)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Thời gian ra</p>
                      <p className="text-xs font-medium text-slate-700">{record.exit_time ? formatDate(record.exit_time) : '--'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Thanh toán</p>
                      <p className="text-xs font-bold text-primary-600">
                        {record.invoice?.amount ? formatCurrency(record.invoice.amount) : 
                         (record.invoice?.[0]?.amount ? formatCurrency(record.invoice[0].amount) : 
                          (record.invoices?.[0]?.amount ? formatCurrency(record.invoices[0].amount) : '--'))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchHistory

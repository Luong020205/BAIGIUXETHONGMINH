import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'
import { Calendar, Download, Filter, BarChart3, TrendingUp, Car, Bike, Loader2 } from 'lucide-react'
import { supabase } from '../../utils/supabaseClient'
import { formatCurrency } from '../../utils/helpers'
import { Button } from '../../components/common/Button'

const Reports = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d') // 7d, 30d, 90d

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    // Simulate complex report query
    setTimeout(() => {
      setData([
        { date: '10/03', revenue: 1500000, cars: 45, motorcycles: 120 },
        { date: '11/03', revenue: 1800000, cars: 52, motorcycles: 145 },
        { date: '12/03', revenue: 1200000, cars: 38, motorcycles: 110 },
        { date: '13/03', revenue: 2500000, cars: 65, motorcycles: 180 },
        { date: '14/03', revenue: 3100000, cars: 72, motorcycles: 210 },
        { date: '15/03', revenue: 2100000, cars: 58, motorcycles: 165 },
        { date: 'Hôm nay', revenue: 2800000, cars: 62, motorcycles: 195 },
      ])
      setLoading(false)
    }, 800)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Báo cáo & Thống kê</h2>
          <p className="text-slate-500">Phân tích chuyên sâu về doanh thu và lưu lượng bãi xe</p>
        </div>
        <div className="flex gap-2">
          <select 
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-primary-500/20 outline-none"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
            <option value="90d">90 ngày qua</option>
          </select>
          <Button variant="secondary" icon={Download}>Xuất báo cáo</Button>
        </div>
      </div>

      {loading ? (
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* Revenue Chart */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Biểu đồ doanh thu</h3>
              </div>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vehicle Volume Chart */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-50">
              <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                Lưu lượng phương tiện
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip />
                    <Legend verticalAlign="top" align="right" />
                    <Bar dataKey="cars" name="Ô tô" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="motorcycles" name="Xe máy" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-50">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Chi tiết hằng ngày</h3>
              <div className="space-y-4">
                {data.map((day, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold text-slate-500">
                        {day.date.split('/')[0]}
                        <span className="text-xs">TH3</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{formatCurrency(day.revenue)}</p>
                        <p className="text-xs text-slate-400">{day.cars} ô tô, {day.motorcycles} xe máy</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold ${day.revenue > 2000000 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {day.revenue > 2000000 ? <TrendingUp className="w-3 h-3" /> : null}
                      {day.revenue > 2000000 ? 'Cao' : 'Bình thường'}
                    </div>
                  </div>
                )).reverse()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports

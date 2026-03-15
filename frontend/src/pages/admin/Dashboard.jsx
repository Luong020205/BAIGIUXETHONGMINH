import React, { useEffect, useState } from 'react'
import { 
  Users, 
  Car, 
  TrendingUp, 
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { supabase } from '../../utils/supabaseClient'
import { formatCurrency } from '../../utils/helpers'

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      {trend && (
        <div className={`flex items-center mt-2 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {trendValue} so với hôm qua
        </div>
      )}
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
)

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCars: 0,
    freeSpots: 0,
    todayRevenue: 0,
    totalUsers: 0
  })
  const [revenueData, setRevenueData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // 1. Fetch total current parked cars
      const { data: areas } = await supabase.from('parking_areas').select('current_count, capacity')
      const totalParked = areas?.reduce((acc, area) => acc + area.current_count, 0) || 0
      const totalCapacity = areas?.reduce((acc, area) => acc + area.capacity, 0) || 0

      // 2. Fetch today's revenue
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { data: todayInvoices } = await supabase
        .from('invoices')
        .select('amount')
        .gte('created_at', today.toISOString())
        .eq('payment_status', 'paid')
      
      const revenueToday = todayInvoices?.reduce((acc, inv) => acc + inv.amount, 0) || 0

      // 3. Fetch total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalCars: totalParked,
        freeSpots: totalCapacity - totalParked,
        todayRevenue: revenueToday,
        totalUsers: userCount || 0
      })

      // 4. Mock chart data (in real app, you'd aggregate from DB)
      setRevenueData([
        { name: 'T2', revenue: 1200000 },
        { name: 'T3', revenue: 1900000 },
        { name: 'T4', revenue: 1500000 },
        { name: 'T5', revenue: 2200000 },
        { name: 'T6', revenue: 3100000 },
        { name: 'T7', revenue: 2800000 },
        { name: 'CN', revenue: revenueToday > 0 ? revenueToday : 2400000 },
      ])
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tổng quan hệ thống</h2>
        <p className="text-slate-500">Chào mừng bạn trở lại, Admin!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Xe đang gửi" 
          value={stats.totalCars} 
          icon={Car} 
          trend="up" 
          trendValue="12%" 
          color="bg-blue-600"
        />
        <StatCard 
          title="Chỗ còn trống" 
          value={stats.freeSpots} 
          icon={MapPin} 
          color="bg-emerald-500"
        />
        <StatCard 
          title="Doanh thu hôm nay" 
          value={formatCurrency(stats.todayRevenue)} 
          icon={TrendingUp} 
          trend="up" 
          trendValue="8.5%" 
          color="bg-primary-600"
        />
        <StatCard 
          title="Người dùng" 
          value={stats.totalUsers} 
          icon={Users} 
          color="bg-purple-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-50">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 font-primary">Doanh thu 7 ngày gần nhất</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000000}M`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                />
                <Bar 
                  dataKey="revenue" 
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                >
                  {revenueData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === revenueData.length - 1 ? '#0ea5e9' : '#e2e8f0'} 
                      className="hover:fill-primary-400 transition-all duration-300"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Trạng thái bãi xe</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Ô tô</span>
                <span className="font-semibold">{Math.round((stats.totalCars / (stats.totalCars + stats.freeSpots)) * 100) || 0}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary-600 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.round((stats.totalCars / (stats.totalCars + stats.freeSpots)) * 100) || 0}%` }}
                ></div>
              </div>
            </div>
            
            {/* More status bars could go here */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-slate-700">Đang hoạt động tốt</span>
                </div>
                <span className="text-xs text-slate-400">Vừa cập nhật</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

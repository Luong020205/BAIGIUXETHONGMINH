import React, { useEffect, useState, useCallback } from 'react'
import { 
  Users, 
  Car, 
  TrendingUp, 
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw
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
          {trendValue}
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
    totalUsers: 0,
    totalCapacity: 0
  })
  const [revenueData, setRevenueData] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const fetchDashboardData = useCallback(async () => {
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
        totalUsers: userCount || 0,
        totalCapacity
      })

      // 4. Fetch last 7 days revenue from actual data
      const last7Days = []
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const { data: dayInvoices } = await supabase
          .from('invoices')
          .select('amount')
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString())
          .eq('payment_status', 'paid')

        const dayRevenue = dayInvoices?.reduce((acc, inv) => acc + inv.amount, 0) || 0
        
        last7Days.push({
          name: dayNames[date.getDay()],
          date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          revenue: dayRevenue,
          isToday: i === 0
        })
      }

      setRevenueData(last7Days)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Real-time subscriptions
  useEffect(() => {
    const channels = []

    // Subscribe to parking_records changes
    const recordsChannel = supabase
      .channel('dashboard-records')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_records' }, () => {
        fetchDashboardData()
      })
      .subscribe()
    channels.push(recordsChannel)

    // Subscribe to invoices changes
    const invoicesChannel = supabase
      .channel('dashboard-invoices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchDashboardData()
      })
      .subscribe()
    channels.push(invoicesChannel)

    // Subscribe to parking_areas changes
    const areasChannel = supabase
      .channel('dashboard-areas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_areas' }, () => {
        fetchDashboardData()
      })
      .subscribe()
    channels.push(areasChannel)

    // Subscribe to profiles changes (for user count)
    const profilesChannel = supabase
      .channel('dashboard-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchDashboardData()
      })
      .subscribe()
    channels.push(profilesChannel)

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch))
    }
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const occupancyPercent = stats.totalCapacity > 0 
    ? Math.round((stats.totalCars / stats.totalCapacity) * 100) 
    : 0

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tổng quan hệ thống</h2>
          <p className="text-slate-500">Chào mừng bạn trở lại, Admin!</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          Cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Xe đang gửi" 
          value={stats.totalCars} 
          icon={Car} 
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
                  tickFormatter={(value) => value >= 1000000 ? `${value / 1000000}M` : value >= 1000 ? `${value / 1000}K` : value}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload
                    return item?.date ? `${label} (${item.date})` : label
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                >
                  {revenueData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isToday ? '#0ea5e9' : '#e2e8f0'} 
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
                <span className="text-slate-500">Tỉ lệ lấp đầy</span>
                <span className="font-semibold">{occupancyPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    occupancyPercent > 80 ? 'bg-red-500' : occupancyPercent > 50 ? 'bg-amber-500' : 'bg-primary-600'
                  }`} 
                  style={{ width: `${occupancyPercent}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Đang đỗ</span>
                </div>
                <span className="text-sm font-bold text-blue-600">{stats.totalCars}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-900">Trống</span>
                </div>
                <span className="text-sm font-bold text-emerald-600">{stats.freeSpots}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-700">Đang hoạt động tốt</span>
                </div>
                <span className="text-xs text-slate-400">Theo dõi real-time</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

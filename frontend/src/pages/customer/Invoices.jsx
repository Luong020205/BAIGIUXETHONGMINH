import React, { useEffect, useState } from 'react'
import { Receipt, CreditCard, Banknote, Calendar, Loader2, ArrowRight, Download, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../utils/supabaseClient'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { useSupabase } from '../../hooks/useSupabase'
import { useAuth } from '../../hooks/useAuth'

const Invoices = () => {
  const [invoices, setInvoices] = useState([])
  const { profile } = useAuth()
  const { query, loading } = useSupabase()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    // Fetch specifically this customer's invoices via record relation
    const { data } = await query((s) => 
      s.from('invoices')
        .select(`
          *,
          record:parking_records!inner(license_plate, vehicle_type, entry_time, exit_time, customer_id)
        `)
        .eq('record.customer_id', profile?.id)
        .order('created_at', { ascending: false })
    )
    if (data) setInvoices(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hóa đơn thanh toán</h2>
          <p className="text-slate-500">Quản lý các giao dịch phí gửi xe của bạn</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-950 text-white font-bold hover:bg-slate-800 transition-all text-sm shadow-xl">
          <Download className="w-4 h-4" />
          Tải tất cả
        </button>
      </div>

      {loading && invoices.length === 0 ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-100">
          <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Bạn chưa có hóa đơn nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {invoices.map((inv) => (
            <div key={inv.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all group">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">#{inv.id.slice(0, 8)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 px-2.5 py-1 bg-emerald-50 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ĐÃ THANH TOÁN
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Thành tiền</p>
                    <h3 className="text-3xl font-black text-slate-900">{formatCurrency(inv.amount)}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Phương thức</p>
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 justify-end">
                      {inv.payment_method === 'cash' ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                      <span className="capitalize">{inv.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Biển số xe:</span>
                    <span className="font-bold text-slate-700 italic">{inv.record?.license_plate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Ngày thanh toán:</span>
                    <span className="font-medium text-slate-600">{formatDate(inv.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <button className="w-full py-4 bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 hover:text-primary-600 transition-all border-t border-slate-50 group-hover:border-slate-100">
                Chi tiết hóa đơn
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Invoices

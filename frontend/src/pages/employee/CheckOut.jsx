import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Search, Clock, CreditCard, Banknote, Loader2, ArrowRight, Car, Bike, Receipt, Scan, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../utils/supabaseClient'
import { useSupabase } from '../../hooks/useSupabase'
import { useAuth } from '../../hooks/useAuth'
import { calculateParkingFee, formatCurrency, formatDate } from '../../utils/helpers'
import { PARKING_STATUS, PAYMENT_METHODS } from '../../utils/constants'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { useToast } from '../../context/ToastContext'
import { Scanner } from '../../components/common/Scanner'

const CheckOut = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [record, setRecord] = useState(null)
  const [pricing, setPricing] = useState([])
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH)
  const [calculating, setCalculating] = useState(false)
  const [feeDetails, setFeeDetails] = useState(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isPaying, setIsPaying] = useState(false)

  const { profile } = useAuth()
  const { query, loading } = useSupabase()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchPricing()
  }, [])

  const fetchPricing = async () => {
    const { data } = await supabase.from('pricing').select('*')
    if (data) setPricing(data)
  }

  // Real-time update for fee calculation
  useEffect(() => {
    let timer;
    if (record) {
      const updateFee = () => {
        const vehiclePricing = pricing.find(p => p.vehicle_type === record.vehicle_type)
        const details = calculateParkingFee(record.entry_time, vehiclePricing?.hourly_rate || 0)
        // Map helpers.js keys (hours, amount) to local keys (durationHours, totalFee)
        setFeeDetails({
          durationHours: details.chargedHours,
          displayDuration: `${details.hours} giờ ${details.minutes} phút`,
          totalFee: details.amount
        })
      }
      
      updateFee() // Immediate calculation
      timer = setInterval(updateFee, 10000) // Update every 10 seconds
    } else {
      setFeeDetails(null)
    }
    return () => clearInterval(timer)
  }, [record, pricing])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchTerm) return

    setCalculating(true)
    const { data, error } = await supabase
      .from('parking_records')
      .select('*, area:parking_areas(code), slot:parking_slots(slot_number)')
      .eq('license_plate', searchTerm.toUpperCase())
      .eq('status', PARKING_STATUS.IN)
      .single()

    if (error) {
      showToast('Không tìm thấy xe này trong bãi', 'error')
      setRecord(null)
    } else {
      setRecord(data)
    }
    setCalculating(false)
  }

  const handleProcessCheckout = async () => {
    if (!record || !feeDetails) return

    if (paymentMethod === PAYMENT_METHODS.ONLINE) {
      setIsPaymentModalOpen(true)
      return
    }

    await finalizeCheckout()
  }

  const finalizeCheckout = async () => {
    setCalculating(true)
    // 1. Create Invoice
    const { error: invoiceError } = await query((s) => 
      s.from('invoices').insert([{
        record_id: record.id,
        amount: feeDetails.totalFee,
        payment_method: paymentMethod,
        payment_status: 'paid',
        paid_at: new Date().toISOString()
      }])
    )

    if (invoiceError) return

    // 2. Update Slot Status (Release the slot)
    if (record.slot_id) {
      const { error: slotError } = await query((s) => 
        s.from('parking_slots')
          .update({ 
            status: 'available',
            customer_id: null // Clear any reservation
          })
          .eq('id', record.slot_id)
      )
      if (slotError) return
    }

    // 3. Mark Record as OUT
    const { error: recordError } = await query((s) => 
      s.from('parking_records')
        .update({ 
          status: PARKING_STATUS.OUT, 
          exit_time: new Date().toISOString() 
        })
        .eq('id', record.id),
      'Thanh toán và trả xe thành công!'
    )

    if (!recordError) {
      setIsPaymentModalOpen(false)
      navigate('/employee')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-900 italic">TRA XE & THANH TOÁN</h2>
        <p className="text-slate-500 mt-2">Nhập biển số xe để tính phí và in hóa đơn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Search Section */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSearch} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <div className="relative">
              <Input
                label="Tìm biển số"
                placeholder="30A-12345"
                className="text-xl font-bold uppercase tracking-widest"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              />
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="absolute right-3 top-[34px] p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                title="Quét camera"
              >
                <Scan className="w-5 h-5" />
              </button>
            </div>
            <Button className="w-full py-3" icon={Search} loading={calculating} type="submit">
              Kiểm tra phí
            </Button>
          </form>

          {record && (
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-6">
              <h3 className="font-bold border-b border-white/10 pb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary-400" />
                Thông tin lượt gửi
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Biển số:</span>
                  <span className="font-bold">{record.license_plate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vào lúc:</span>
                  <span className="font-medium text-slate-200">{formatDate(record.entry_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Khu vực:</span>
                  <span className="font-bold text-primary-400 uppercase">{record.area?.code}</span>
                </div>
                {record.slot && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vị trí (Slot):</span>
                    <span className="font-bold text-amber-400 uppercase">{record.slot.slot_number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Thời lượng:</span>
                  <span className="font-bold">
                    {feeDetails?.displayDuration}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Section */}
        <div className="lg:col-span-2">
          {record && feeDetails ? (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Tổng số tiền cần thu</p>
                <h1 className="text-5xl font-black text-primary-600">
                  {formatCurrency(feeDetails.totalFee)}
                </h1>
              </div>

              <div className="space-y-6">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  Phương thức thanh toán
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod(PAYMENT_METHODS.CASH)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                      paymentMethod === PAYMENT_METHODS.CASH 
                        ? 'border-primary-600 bg-primary-50 text-primary-700' 
                        : 'border-slate-50 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${paymentMethod === PAYMENT_METHODS.CASH ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <Banknote className="w-6 h-6" />
                    </div>
                    <span className="font-bold">Tiền mặt</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod(PAYMENT_METHODS.ONLINE)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                      paymentMethod === PAYMENT_METHODS.ONLINE 
                        ? 'border-primary-600 bg-primary-50 text-primary-700' 
                        : 'border-slate-50 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${paymentMethod === PAYMENT_METHODS.ONLINE ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <span className="font-bold">Chuyển khoản / App</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-4">
                <Button variant="secondary" className="flex-1 py-4 text-lg font-bold" onClick={() => setRecord(null)}>
                  Hủy
                </Button>
                <Button className="flex-[2] py-4 text-lg font-black uppercase tracking-widest" onClick={handleProcessCheckout} loading={loading} icon={ArrowRight}>
                  Xác nhận thanh toán
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 space-y-4">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                <Car className="w-10 h-10 opacity-20" />
              </div>
              <p className="font-medium">Tìm biển số xe bên trái để tiếp tục</p>
            </div>
          )}
        </div>
      </div>

      {/* Camera Scanner */}
      <Scanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(plate) => {
          setSearchTerm(plate)
          // Automatically trigger search
          handleSearch({ preventDefault: () => {} })
        }}
      />

      {/* Online Payment Modal */}
      <Modal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)}
        title="Thanh toán Online (VietQR)"
      >
        <div className="space-y-6 text-center">
          <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm inline-block mx-auto border border-slate-100">
              {/* Using a placeholder for QR code - in production, this would be a dynamic VietQR link */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PARKING_${record?.id}_${feeDetails?.totalFee}`} 
                alt="QR Code" 
                className="w-48 h-48"
              />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Số tiền thanh toán</p>
              <h2 className="text-3xl font-black text-primary-600">{formatCurrency(feeDetails?.totalFee)}</h2>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 py-2 rounded-xl text-sm font-medium animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang chờ hệ thống xác nhận thanh toán...
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>Quay lại</Button>
            <Button 
              className="font-bold bg-emerald-600 hover:bg-emerald-700" 
              onClick={finalizeCheckout}
              loading={loading}
              icon={CheckCircle2}
            >
              Xác nhận đã trả
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CheckOut

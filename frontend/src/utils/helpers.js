import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export const formatDate = (date, formatStr = 'HH:mm dd/MM/yyyy') => {
  if (!date) return ''
  return format(new Date(date), formatStr, { locale: vi })
}

export const calculateParkingFee = (entryTime, hourlyRate) => {
  const entry = new Date(entryTime)
  const now = new Date()
  const diffInMs = Math.max(0, now - entry)
  
  const totalMinutes = Math.floor(diffInMs / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  // Per-minute billing logic:
  // (Total Minutes / 60) * Hourly Rate
  // Round to nearest 1,000 VND for payment convenience
  const rawAmount = (totalMinutes / 60) * hourlyRate
  
  // Minimum fee 2,000 VND if time > 0, otherwise calculated
  const amount = totalMinutes > 0 
    ? Math.max(2000, Math.ceil(rawAmount / 1000) * 1000) 
    : 0
  
  return {
    totalMinutes,
    hours,
    minutes,
    chargedHours: totalMinutes / 60, // Exact decimal representation
    amount
  }
}

import React from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { twMerge } from 'tailwind-merge'

const icons = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
}

const styles = {
  success: 'border-emerald-100 bg-emerald-50',
  error: 'border-red-100 bg-red-50',
  info: 'border-blue-100 bg-blue-50',
}

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={twMerge(
            'flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto animate-in slide-in-from-right-4 duration-300',
            styles[toast.type] || styles.info
          )}
        >
          <div className="mt-0.5">{icons[toast.type] || icons.info}</div>
          <div className="flex-1 text-sm font-medium text-slate-800">{toast.message}</div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

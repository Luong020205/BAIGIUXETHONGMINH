import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-md active:scale-95',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md active:scale-95',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md active:scale-95',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg font-medium',
}

export const Button = ({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  icon: Icon,
  ...props
}) => {
  return (
    <button
      className={twMerge(
        'inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 mr-2" />
      ) : null}
      {children}
    </button>
  )
}

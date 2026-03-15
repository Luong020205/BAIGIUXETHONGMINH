import React from 'react'
import { twMerge } from 'tailwind-merge'

export const Input = React.forwardRef(({
  label,
  error,
  type = 'text',
  className,
  icon: Icon,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={twMerge(
            'w-full px-4 py-2 rounded-lg border border-slate-200 bg-white transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
            'placeholder:text-slate-400',
            Icon ? 'pl-10' : '',
            error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : '',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'

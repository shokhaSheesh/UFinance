import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const Input = forwardRef(({
  className,
  error,
  hasError,
  type = 'text',
  action = 'default',
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  return (
    <div className="relative flex items-center w-full">
      {leftIcon && (
        <span className="absolute left-2 flex items-center justify-center text-gray-400 pointer-events-none z-10">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        type={type}
        className={cn(
          "w-full px-3 py-1.5 text-sm text-slate-900 border border-slate-200 rounded-lg bg-white h-9 transition-all cursor-text placeholder:text-slate-400 hover:border-slate-300",
          "placeholder:text-gray-400 placeholder:opacity-100",
          "focus:outline-none focus:border-[#0e73f6] focus:ring-3 focus:ring-[#0e73f6]/15",
          "disabled:text-gray-500 disabled:cursor-not-allowed",
          (error || hasError) && "border-red-ucode! border",
          action === 'filter' && "bg-slate-50",
          leftIcon && "pl-9",
          rightIcon && "pr-9",
          className
        )}
        {...props}
      />
      {rightIcon && (
        <span className="absolute right-3 flex items-center justify-center text-gray-400 pointer-events-none z-10">
          {rightIcon}
        </span>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input

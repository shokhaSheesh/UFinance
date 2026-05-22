import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const TextArea = forwardRef(({ 
  className, 
  hasError, 
  ...props 
}, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full px-3 py-2 text-[13px] text-slate-900 border border-gray-ucode-200 shadow-none rounded-lg!  resize-none! bg-white transition-all duration-200",
        "placeholder:text-gray-400 outline-none",
        "disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed min-h-[100px]",
        hasError && "border-red-ucode! border! focus:ring-red-ucode! focus:border-red-ucode!",
        className
      )}
      {...props}
    />
  )
})

TextArea.displayName = 'TextArea'

export default TextArea
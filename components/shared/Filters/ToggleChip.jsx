'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

/**
 * Переключатель-«пилюля» вместо чекбокса в окне фильтров.
 * Выбранное состояние видно по заливке и галочке, а не по крошечному квадрату.
 */
export default function ToggleChip({ checked, onChange, children, size = 'md', className }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium cursor-pointer transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]',
        size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
        checked
          ? 'border-[#0e73f6] bg-[#eef4ff] text-[#0e73f6]'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
        className
      )}
    >
      {checked && <Check size={size === 'sm' ? 12 : 14} aria-hidden="true" />}
      {children}
    </button>
  )
}

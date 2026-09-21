'use client'

import { cn } from '@/lib/utils'

/**
 * Переключатель из нескольких видимых вариантов вместо выпадающего списка.
 * Все варианты на виду: выбранный понятен без клика, смена — в один клик.
 *
 * @param {{value: string, label: string, icon?: Component}[]} options
 */
export default function Segmented({ options = [], value, onChange, className, ariaLabel }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex shrink-0 items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5', className)}
    >
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const active = optionValue === value
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(optionValue)}
            className={cn(
              'flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium cursor-pointer transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0e73f6]',
              active ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.12)]' : 'text-slate-500 hover:text-slate-900'
            )}
          >
            {Icon && <Icon size={15} aria-hidden="true" />}
            {label}
          </button>
        )
      })}
    </div>
  )
}

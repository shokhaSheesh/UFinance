'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

/**
 * Кнопка-иконка в стиле кнопки «Фильтры»: контурная, 36px, с подписью
 * для скринридера и тултипом.
 *
 * Появилась под выгрузку: раньше «Скачать Excel» прятался за меню «три
 * точки» с единственным пунктом — лишний клик и лишнее меню там, где
 * нужно одно действие. Меню из трёх точек остаётся для строк таблиц,
 * где действий действительно несколько.
 */
const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, loading = false, disabled, className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white',
        'text-slate-700 cursor-pointer transition-colors hover:bg-gray-50 hover:text-slate-900',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      ) : (
        <Icon size={18} aria-hidden="true" />
      )}
    </button>
  )
})

export default IconButton

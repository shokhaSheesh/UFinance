'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

/**
 * Контурная кнопка в стиле кнопки «Фильтры»: иконка плюс подпись.
 *
 * Подпись можно скрыть (`iconOnly`) — тогда остаётся квадратная кнопка,
 * а текст живёт в aria-label и тултипе. По умолчанию текст виден: у
 * выгрузки одной иконки мало, чтобы понять, что именно скачается.
 *
 * Появилась под выгрузку: раньше «Скачать Excel» прятался за меню «три
 * точки» с единственным пунктом — лишний клик и лишнее меню там, где
 * нужно одно действие. Меню из трёх точек остаётся для строк таблиц,
 * где действий действительно несколько.
 */
const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, loading = false, disabled, iconOnly = false, className, ...props },
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
        'flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white',
        iconOnly ? 'w-9' : 'px-3 text-sm font-medium',
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
      {!iconOnly && <span>{label}</span>}
    </button>
  )
})

export default IconButton

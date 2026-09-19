'use client'

import { cn } from '@/lib/utils'
import { SlidersHorizontal } from 'lucide-react'
import { useTranslations } from 'next-intl'

/**
 * Кнопка открытия панели фильтров — ставится в шапку страницы рядом с поиском.
 *
 * Счётчик активных фильтров показывается прямо на кнопке: панель теперь
 * закрыта по умолчанию, и без счётчика пользователь не видел бы, что смотрит
 * на отфильтрованные данные.
 */
export default function FilterButton({ onClick, count = 0, className }) {
  const t = useTranslations()
  const hasActive = count > 0

  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className={cn(
        'flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-medium cursor-pointer transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]',
        hasActive
          ? 'border-[#0e73f6] bg-[#e3eeff] text-[#0e73f6] hover:bg-[#d5e5ff]'
          : 'border-gray-300 bg-white text-slate-700 hover:bg-gray-50',
        className
      )}
    >
      <SlidersHorizontal size={16} aria-hidden="true" />
      <span>{t('filter')}</span>
      {hasActive && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0e73f6] px-1.5 text-xs font-semibold text-white tabular-nums">
          {count}
        </span>
      )}
    </button>
  )
}

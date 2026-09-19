'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'

/**
 * Полоса активных фильтров над таблицей.
 *
 * Ключевая часть перехода с боковой колонки на кнопку: панель теперь закрыта,
 * и без этой полосы пользователь не видел бы, что таблица отфильтрована —
 * а принять частичную сумму за полную в финансовом учёте дорого.
 *
 * @param {{key: string, label: string, value: string, onRemove: () => void}[]} chips
 */
export default function FilterChips({ chips = [], onClearAll, className }) {
  const t = useTranslations()

  if (!chips.length) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2',
        className
      )}
    >
      <span className="text-xs font-medium text-slate-500">{t('filters.active')}</span>

      {chips.map((chip) => (
        <span
          key={chip.key}
          className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white py-1 pl-2.5 pr-1 text-xs text-slate-700"
        >
          <span className="text-slate-500">{chip.label}:</span>
          <span className="font-medium" title={chip.value}>
            {chip.value}
          </span>
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={t('filters.removeFilter', { name: chip.label })}
            className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 cursor-pointer transition-colors hover:bg-gray-200 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0e73f6]"
          >
            <X size={12} aria-hidden="true" />
          </button>
        </span>
      ))}

      {chips.length > 1 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="ml-1 rounded px-1.5 py-0.5 text-xs font-medium text-slate-500 cursor-pointer underline-offset-2 transition-colors hover:text-slate-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]"
        >
          {t('filters.clearAll')}
        </button>
      )}
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { Maximize2, Minimize2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

const storageKey = (page) => `table-only:${page}`

/**
 * Режим «только таблица»: шапка страницы и карточки итогов сворачиваются,
 * таблица занимает освободившееся место. Выбор запоминается для страницы,
 * Esc возвращает обычный вид.
 */
export function useTableOnly(page) {
  const [tableOnly, setTableOnly] = useState(false)

  useEffect(() => {
    try {
      setTableOnly(window.localStorage.getItem(storageKey(page)) === '1')
    } catch {
      /* хранилище недоступно — просто обычный вид */
    }
  }, [page])

  const toggle = useCallback(() => {
    setTableOnly((value) => {
      const next = !value
      try {
        window.localStorage.setItem(storageKey(page), next ? '1' : '0')
      } catch {
        /* noop */
      }
      return next
    })
  }, [page])

  useEffect(() => {
    if (!tableOnly) return
    const onKeyDown = (event) => {
      // Esc в открытых окнах закрывает их — сюда доходит, только если окон нет
      if (event.key === 'Escape' && !document.querySelector('[role="dialog"]')) toggle()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [tableOnly, toggle])

  return [tableOnly, toggle]
}

/**
 * Плавно сворачиваемый блок (шапка, итоги) — высота анимируется через
 * grid-template-rows, без замеров.
 */
export function Collapsible({ collapsed, className, children }) {
  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
        collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
        className
      )}
      aria-hidden={collapsed || undefined}
      inert={collapsed ? true : undefined}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}

/** Кнопка переключения в панели над таблицей. */
export default function TableOnlyToggle({ tableOnly, onToggle }) {
  const t = useTranslations('Common')
  const label = tableOnly ? t('showSummary') : t('tableOnly')
  const Icon = tableOnly ? Minimize2 : Maximize2
  return (
    <button
      type="button"
      onClick={onToggle}
      title={label}
      aria-label={label}
      aria-pressed={tableOnly}
      className={cn('secondary-btn h-9 gap-2', tableOnly && 'border-[#0e73f6] text-[#0e73f6]')}
    >
      <Icon size={16} aria-hidden="true" />
      <span className="hidden xl:inline">{label}</span>
    </button>
  )
}

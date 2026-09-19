'use client'

import useModalPresence from '@/hooks/useModalPresence'
import useMounted from '@/hooks/useMounted'
import { cn } from '@/lib/utils'
import { RotateCcw, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'

/**
 * Панель фильтров — выезжает справа поверх содержимого.
 *
 * Пришла на смену постоянной колонке слева (FilterSidebar). Оверлей выбран
 * намеренно: старая колонка сжимала таблицу, из-за чего при открытии и
 * закрытии фильтров менялась ширина колонок и «прыгали» суммы, по которым
 * пользователь ведёт взглядом. Оверлей геометрию таблицы не трогает.
 *
 * Фильтры применяются сразу, кнопки «Применить» нет: результат виден за
 * панелью, а счётчик на кнопке и чипсы над таблицей показывают, что включено.
 */
export function FilterDrawer({ isOpen, onClose, children, clearCount = 0, onClear, title }) {
  useModalPresence(isOpen)

  const t = useTranslations()
  const mounted = useMounted()
  const panelRef = useRef(null)
  const closeRef = useRef(null)

  // Esc закрывает панель
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Фокус уходит внутрь панели, иначе с клавиатуры она недостижима
  useEffect(() => {
    if (isOpen) closeRef.current?.focus()
  }, [isOpen])

  // Пока панель открыта, страница под ней не скроллится
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  if (!mounted) return null

  return (
    <>
      {/* Затемнение */}
      <div
        className={cn(
          'fixed inset-0 z-[1000] bg-black/30 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || t('filter')}
        aria-hidden={!isOpen}
        className={cn(
          'fixed right-0 top-0 z-[1001] flex h-screen w-[360px] max-w-[92vw] flex-col bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.1)]',
          'transition-transform duration-200 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">{title || t('filter')}</h2>
            {clearCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0e73f6] px-1.5 text-xs font-semibold text-white tabular-nums">
                {clearCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {clearCount > 0 && onClear && (
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-slate-600 cursor-pointer transition-colors hover:bg-gray-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]"
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span>{t('filters.reset')}</span>
              </button>
            )}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={t('filters.close')}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 cursor-pointer transition-colors hover:bg-gray-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-visible! px-4 py-3">{children}</div>
      </aside>
    </>
  )
}

export function FilterSection({ title, children, className }) {
  return (
    <div className={cn('my-2 flex flex-col gap-2', className)}>
      <h3 className="text-sm font-medium text-slate-600">{title}</h3>
      {children}
    </div>
  )
}

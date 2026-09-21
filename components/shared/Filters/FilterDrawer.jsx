'use client'

import useModalPresence from '@/hooks/useModalPresence'
import useMounted from '@/hooks/useMounted'
import { cn } from '@/lib/utils'
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * Окно фильтров — по центру экрана, а не выезжающая сбоку панель.
 *
 * Боковая панель была узкой колонкой: двенадцать групп фильтров шли одна под
 * другой, и до нижних приходилось листать. В окне поля идут сеткой в две
 * колонки под заголовками групп, у каждого поля есть подпись (FilterField) —
 * раньше многие выпадающие списки были подписаны только плейсхолдером,
 * который исчезает после выбора.
 *
 * Фильтры применяются сразу; «Готово» закрывает окно, счётчик на ней
 * показывает, сколько фильтров включено. Имя компонента прежнее — через него
 * открываются все тринадцать панелей фильтров.
 */
export function FilterDrawer({ isOpen, onClose, children, clearCount = 0, onClear, title }) {
  useModalPresence(isOpen)

  const t = useTranslations()
  const mounted = useMounted()
  const closeRef = useRef(null)

  // Esc закрывает окно
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Фокус внутрь окна, иначе с клавиатуры оно недостижимо
  useEffect(() => {
    if (isOpen) closeRef.current?.focus()
  }, [isOpen])

  // Страница под окном не скроллится
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  if (!mounted) return null

  // Портал в body: окно должно быть над шапкой, меню и таблицей, а не внутри
  // контейнера страницы с его собственным overflow
  return createPortal(
    <div
      className={cn(
        'fixed inset-y-0 left-0 right-[var(--ai-w,0px)] z-[1000] flex items-center justify-center p-4 transition-opacity duration-200',
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
      aria-hidden={!isOpen}
    >
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || t('filter')}
        className={cn(
          'relative flex max-h-[88vh] w-[760px] max-w-full flex-col rounded-2xl bg-white shadow-[0_24px_64px_rgba(15,23,42,0.22)]',
          'transition-transform duration-200 ease-out',
          isOpen ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.98]'
        )}
      >
        {/* Шапка */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef4ff] text-[#0e73f6]">
              <SlidersHorizontal size={18} aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold text-slate-900">{title || t('filter')}</h2>
            {clearCount > 0 && (
              <span className="rounded-full bg-[#0e73f6] px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
                {clearCount}
              </span>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('filters.close')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 cursor-pointer transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Поля */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-2">{children}</div>

        {/* Подвал */}
        <div className="flex h-16 shrink-0 items-center justify-between border-t border-slate-200 px-6">
          {clearCount > 0 && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-2 rounded-lg px-3 h-9 text-sm font-medium text-slate-600 cursor-pointer transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]"
            >
              <RotateCcw size={15} aria-hidden="true" />
              {t('filters.clearAll')}
            </button>
          ) : (
            <span className="text-sm text-slate-400">{t('filters.noneActive')}</span>
          )}
          <button type="button" onClick={onClose} className="primary-btn">
            {clearCount > 0 ? t('filters.doneWithCount', { count: clearCount }) : t('filters.done')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/**
 * Группа фильтров: заголовок и поля под ним сеткой в две колонки.
 * Поле во всю ширину — FilterField с full.
 */
export function FilterSection({ title, children, className }) {
  return (
    <section className={cn('border-b border-slate-100 py-5 last:border-b-0', className)}>
      {title && (
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">{children}</div>
    </section>
  )
}

/**
 * Одно поле фильтра с видимой подписью над ним.
 * Раньше многие поля были подписаны только плейсхолдером, который пропадает,
 * как только в поле что-то выбрано.
 */
export function FilterField({ label, children, full = false, className }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', full && 'col-span-2', className)}>
      {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
      {children}
    </div>
  )
}

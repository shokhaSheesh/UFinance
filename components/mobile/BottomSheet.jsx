'use client'

import useModalPresence from '@/hooks/useModalPresence'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Панель, выезжающая снизу — окно телефона.
 *
 * На телефоне окна открываются от нижнего края: туда дотягивается большой
 * палец, и содержимое не приходится сжимать до размеров экрана, как
 * настольному CustomDialog. Заголовок, прокручиваемое тело и нижняя полоса
 * кнопок — те же три части, что у настольного окна, чтобы экраны не
 * расходились по строению.
 */
export default function BottomSheet({ open, onClose, title, subtitle, footer, children, className }) {
  const t = useTranslations('Common')
  useModalPresence(open)

  // Esc — для отладки в браузере; на телефоне окно закрывают затемнением
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex flex-col justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative flex max-h-[88vh] flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgba(15,23,42,0.18)]',
          className
        )}
      >
        {/* Полоска захвата: видно, что панель тянется вниз */}
        <div className="flex justify-center pt-2.5 pb-1">
          <span className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        {title && (
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 pb-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 active:bg-slate-100"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>

        {footer && <div className="shrink-0 border-t border-slate-200 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

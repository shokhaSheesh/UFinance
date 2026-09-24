'use client'

import useModalPresence from '@/hooks/useModalPresence'
import { cn } from '@/lib/utils'
import { Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Оболочка всех окон создания, редактирования и подтверждения.
 *
 * Внутри окна — общие блоки DialogHeader / DialogBody / DialogFooter и строка
 * формы FormRow: раньше каждое из ~40 окон рисовало шапку, отступы, подписи
 * и кнопки по-своему (h2 или h3, p-7 или px-4, подписи слева разной ширины
 * или сверху), и окна одного приложения выглядели как из разных программ.
 *
 * API оболочки прежний (open, onClose, contentClass, overlayClass,
 * elevated), поэтому существующие окна продолжают работать.
 *
 * `elevated` поднимает окно над уже открытым: иначе затемнение вложенного
 * окна оказывается под содержимым родительского.
 */
const CustomDialog = ({
  open,
  onClose,
  children,
  contentClass,
  overlayClass = '',
  elevated = false,
}) => {
  useModalPresence(open)

  // Esc закрывает окно
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null
  // Рендерим в body: многие окна открываются из селектов внутри <form>, и
  // вложенная форма всплывала submit'ом в родительскую
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-y-0 left-0 right-[var(--ai-w,0px)] flex items-center justify-center p-4',
        // 1050 — над окнами фильтров и операции (1000); вложенное окно — 1080.
        // Оба ниже выпадающих слоёв (1100), иначе списки внутри окна
        // открывались бы под ним.
        elevated ? 'z-[1080]' : 'z-[1050]'
      )}
    >
      <div
        className={cn('absolute inset-0 bg-slate-900/40', overlayClass)}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative flex max-h-[90vh] max-w-full flex-col overflow-y-auto rounded-2xl bg-white shadow-[0_24px_64px_rgba(15,23,42,0.22)]',
          contentClass
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export default CustomDialog

/**
 * Шапка окна: необязательный значок, заголовок, подзаголовок, кнопка закрытия.
 * `actions` — кнопки слева от закрытия (например, «Файлы и комментарии»).
 */
export function DialogHeader({ icon: Icon, tone = 'primary', title, subtitle, onClose, actions, className }) {
  const t = useTranslations('Common')
  const toneClass = {
    primary: 'bg-[#eef4ff] text-[#0e73f6]',
    danger: 'bg-red-50 text-red-600',
    neutral: 'bg-slate-100 text-slate-600',
  }[tone]

  return (
    <div className={cn('flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-8 py-5', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', toneClass)}>
            <Icon size={18} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 cursor-pointer transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]"
        >
          <X size={18} aria-hidden="true" />
        </button>
      )}
      </div>
    </div>
  )
}

/** Тело окна: единые отступы, прокрутка, если содержимое длинное. */
export function DialogBody({ children, className }) {
  return (
    <div className={cn('min-h-0 flex-1 overflow-y-auto px-8 py-6', className)}>{children}</div>
  )
}

/** Подвал окна: разделитель, кнопки справа. Слева можно положить доп. содержимое. */
export function DialogFooter({ children, left, className }) {
  return (
    <div className={cn('flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 px-8 py-4', className)}>
      <div className="min-w-0">{left}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

/**
 * Строка формы: подпись слева фиксированной ширины, поле справа —
 * как в окне операции. Ошибка поля — под ним.
 */
export function FormRow({ label, required, hint, error, children, align = 'center', className }) {
  return (
    <div className={cn('flex gap-4', align === 'start' ? 'items-start' : 'items-center', className)}>
      <label className={cn('w-40 shrink-0 text-sm text-slate-700', align === 'start' && 'pt-2')}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {children}
        {hint && !error && <span className="text-xs text-slate-500">{hint}</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  )
}

/**
 * Окно подтверждения (удаление и другие необратимые действия).
 * children — подробности: что именно будет удалено.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  children,
  confirmLabel,
  cancelLabel,
  loading = false,
  danger = true,
  icon,
  error,
  elevated = false,
  // кнопка подтверждения недоступна, пока условие не выполнено (например, не введён пароль)
  confirmDisabled = false,
}) {
  const t = useTranslations('Common')
  return (
    <CustomDialog open={open} onClose={onClose} contentClass="w-[480px]" elevated={elevated}>
      <DialogHeader icon={icon} tone={danger ? 'danger' : 'primary'} title={title} onClose={onClose} />
      <DialogBody className="flex flex-col gap-3 text-sm text-slate-700">
        {message && <p>{message}</p>}
        {children}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </DialogBody>
      <DialogFooter>
        <button type="button" className="secondary-btn h-9" onClick={onClose} disabled={loading}>
          {cancelLabel || t('cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading || confirmDisabled}
          className={cn(
            'flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white cursor-pointer transition-colors disabled:opacity-60',
            'focus-visible:outline-2 focus-visible:outline-offset-2',
            danger ? 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600' : 'bg-[#0e73f6] hover:bg-[#0b5fd4] focus-visible:outline-[#0e73f6]'
          )}
        >
          {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {confirmLabel || t('delete')}
        </button>
      </DialogFooter>
    </CustomDialog>
  )
}

/** Строка «подпись — значение» в окне подтверждения (что удаляем). */
export function ConfirmDetail({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{children}</span>
    </div>
  )
}

'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'

/**
 * Старая оболочка окна (isOpen/className) — теперь поверх общего CustomDialog,
 * чтобы оставшиеся окна выглядели и вели себя так же (затемнение, Esc,
 * скругление, скрытие кнопки ИИ). Поднята над обычными окнами: раньше у неё
 * был z-index 10000, и её открывали поверх других окон.
 */
const CustomModal = ({ isOpen, onClose, children, className }) => {
  const t = useTranslations('Common')

  return (
    <CustomDialog open={isOpen} onClose={onClose} elevated contentClass={cn('p-6', className)}>
      {children}
      <button
        type="button"
        onClick={onClose}
        aria-label={t('close')}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 cursor-pointer transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </CustomDialog>
  )
}

export default CustomModal

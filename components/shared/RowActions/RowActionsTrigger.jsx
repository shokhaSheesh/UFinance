'use client'

import { cn } from '@/lib/utils'
import { EllipsisVertical, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { forwardRef } from 'react'

/**
 * Единая кнопка «три точки» для меню действий — в строках таблиц и в шапках.
 *
 * До этого по проекту жили три разные иконки (EllipsisVertical, MoreVertical
 * и лежащая на боку MoreHorizontal) пяти разных размеров, и часть меню
 * появлялась только при наведении. Наведение здесь не подходит: на строке
 * таблицы пользователь не догадывается, что действия вообще есть, а с
 * клавиатуры и с тача до них не добраться. Кнопка видна всегда.
 *
 * Используется как триггер Radix-меню: <DropdownMenuTrigger asChild>.
 */
const RowActionsTrigger = forwardRef(function RowActionsTrigger(
  { className, size = 18, label, loading = false, disabled, ...props },
  ref
) {
  const t = useTranslations('Common')

  return (
    <button
      ref={ref}
      type="button"
      aria-haspopup="menu"
      aria-label={label || t('actions')}
      disabled={disabled || loading}
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-transparent',
        'text-neutral-600 cursor-pointer transition-colors',
        'hover:bg-neutral-100 hover:text-neutral-900',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]',
        'data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-900',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={size} className="animate-spin" aria-hidden="true" />
      ) : (
        <EllipsisVertical size={size} aria-hidden="true" />
      )}
    </button>
  )
})

export default RowActionsTrigger

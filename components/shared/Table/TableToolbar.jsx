'use client'

import { cn } from '@/lib/utils'

/**
 * Панель над таблицей внутри её рамки: поиск слева, фильтры и прочие
 * переключатели справа.
 *
 * Поиск и фильтры переехали сюда из шапки страницы — они относятся к
 * таблице, а не к разделу, и рядом с ней их связь с содержимым очевиднее.
 * В шапке страницы остаются только заголовок и действия (создать, выгрузить).
 */
export default function TableToolbar({ search, actions, className, children }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 py-2.5',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">{search}</div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        {children}
      </div>
    </div>
  )
}

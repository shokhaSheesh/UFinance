'use client'

import { cn } from '@/lib/utils'

/**
 * Рамка вокруг таблицы.
 *
 * Раньше таблицы упирались в края окна: границы были только между строк,
 * по бокам — ничего, и таблица «вытекала» из страницы. Здесь она становится
 * ограниченной карточкой: рамка со всех сторон, скруглённые углы, свой фон.
 *
 * Внутрь кладётся TableToolbar (поиск и фильтры), затем шапка колонок и строки.
 */
export default function TableCard({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

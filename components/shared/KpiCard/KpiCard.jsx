'use client'

import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/helpers'

/**
 * Карточка показателя над таблицей: подпись, крупная сумма, валюта и
 * пояснение, что именно посчитано.
 *
 * Итоги раньше жили в тонкой полосе, прибитой к низу экрана, мелким шрифтом.
 * Бухгалтер смотрит на них первым делом — поэтому они наверху и крупно.
 *
 * tone="signed" красит сумму: плюс — зелёным, минус — красным (как в таблицах).
 * onClick превращает карточку в фильтр; active — выбранная карточка.
 */
export default function KpiCard({ label, value, currency, hint, icon: Icon, tone = 'plain', onClick, active = false, className }) {
  const n = Number(value) || 0
  const valueClass =
    tone === 'signed' && n !== 0 ? (n > 0 ? 'text-emerald-700' : 'text-red-600') : 'text-slate-900'

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      {...(onClick && { type: 'button', onClick, 'aria-pressed': active })}
      className={cn(
        'flex min-w-0 flex-col gap-1 rounded-xl border bg-white px-4 py-3.5 text-left',
        // выбранная — ровная рамка 2px со всех сторон (внутренняя тень, не внешнее кольцо)
        active ? 'border-[#0e73f6] shadow-[inset_0_0_0_1px_#0e73f6]' : 'border-slate-200',
        onClick && 'cursor-pointer transition-colors hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]',
        onClick && active && 'hover:border-[#0e73f6]',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-slate-600">{label}</span>
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <Icon size={15} aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={cn('truncate text-[22px] font-semibold leading-8 tabular-nums', valueClass)}>
          {tone === 'signed' && n > 0 ? '+' : ''}
          {n === 0 ? '0' : formatNumber(n)}
        </span>
        {currency && <span className="shrink-0 text-sm text-slate-400">{currency}</span>}
      </div>
      {hint && <span className="truncate text-xs text-slate-400">{hint}</span>}
    </Tag>
  )
}

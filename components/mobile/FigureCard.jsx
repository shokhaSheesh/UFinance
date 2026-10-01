'use client'

import { MCard, TileIcon } from '@/components/mobile/ui'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

/**
 * Несколько связанных цифр одной карточкой: строка — значок, подпись,
 * значение справа. Так устроены «За период» на главной, итоги проекта и
 * показатели «Моей компании»: всё видно сразу, листать ничего не нужно.
 *
 * rows: [{ key, icon, tone, label, hint?, value, valueClass? }]
 */
export default function FigureCard({ rows = [], loading = false, className }) {
  return (
    <MCard list className={className}>
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-3 border-b border-slate-100 py-3.5 last:border-b-0">
          <TileIcon icon={row.icon} tone={row.tone} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-slate-900">{row.label}</span>
            {row.hint && <span className="mt-0.5 block truncate text-[12px] text-slate-400">{row.hint}</span>}
          </span>
          <span className={cn('shrink-0 text-[15px] font-bold tabular-nums text-slate-900', row.valueClass)}>
            {loading ? <Loader2 size={16} className="animate-spin text-slate-300" aria-hidden="true" /> : row.value}
          </span>
        </div>
      ))}
    </MCard>
  )
}

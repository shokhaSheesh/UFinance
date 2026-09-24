'use client'

import { cn } from '@/lib/utils'

/**
 * Общие части строк сделок и закупок: инициалы клиента, статус и полоса
 * выполнения. Раньше жили внутри таблицы сделок — закупки повторяли ту же
 * разметку по-своему.
 */
/** Инициалы клиента в кружке — как в справочнике контрагентов. */
export function Monogram({ name }) {
  const letters = (name || '')
    .split(/\s+/)
    .map((word) => word.match(/[\p{L}\p{N}]/u)?.[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  if (!letters) return null
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
      {letters}
    </span>
  )
}

/** Статус сделки: точка и подпись цветом статуса. */
export function StatusPill({ label, color }) {
  const tint = color || '#64748b'
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ color: tint, backgroundColor: `${tint}14` }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tint }} />
      <span className="truncate">{label || '-'}</span>
    </span>
  )
}

/** Процент выполнения полоской; 100% — зелёная. */
export function Progress({ value, label, barClass }) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full', width >= 100 ? 'bg-emerald-600' : barClass)}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-600">{label}</span>
    </div>
  )
}

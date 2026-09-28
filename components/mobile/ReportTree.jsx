'use client'

import Money from '@/components/shared/Money'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

/**
 * Дерево статей отчёта на телефоне.
 *
 * В настольных отчётах у статьи столько значений, сколько периодов в
 * таблице. На телефоне период выбран один, поэтому у строки ровно одно
 * число, а вложенные статьи раскрываются по нажатию. Общее для ДДС и ОПиУ,
 * чтобы отчёты не разъезжались между собой.
 */

export const TOTAL_KEY = '__total__'

const num = (value) => Number(value) || 0

/** Сумма значений узла по всем периодам — для «Итого». */
export const totalOf = (node, keys = []) => keys.reduce((sum, key) => sum + num(node?.values?.[key]), 0)

/** Значение узла за выбранный период. */
export const valueOf = (node, key, keys) => (key === TOTAL_KEY ? totalOf(node, keys) : num(node?.values?.[key]))

/** Первый узел дерева, подходящий под условие. */
export const findRow = (rows = [], test) => {
  for (const row of rows) {
    if (test(row)) return row
    const found = findRow(row?.details || [], test)
    if (found) return found
  }
  return null
}

/** Все узлы с таким названием: «Поступления» есть в каждом потоке. */
export const collectRows = (rows = [], name, acc = []) => {
  rows.forEach((row) => {
    if (row?.name === name) acc.push(row)
    collectRows(row?.details || [], name, acc)
  })
  return acc
}

/** Плитка итога периода. */
export function ReportTile({ label, value, currency, tone = 'neutral', percent = false }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[20px] bg-white px-4 py-3.5">
      <span className="truncate text-[11px] text-slate-500">{label}</span>
      <span
        className={cn(
          'truncate text-[16px] font-bold tabular-nums',
          tone === 'in' ? 'text-emerald-600' : tone === 'out' ? 'text-red-600' : 'text-slate-900'
        )}
      >
        {percent ? (
          value == null ? '—' : `${(Math.round(value * 10) / 10).toLocaleString('ru-RU')}%`
        ) : (
          <Money value={value} currency={currency} />
        )}
      </span>
    </div>
  )
}

/** Строка дерева со вложенными статьями. */
export function TreeRow({ row, periodKey, keys, currency, depth = 0 }) {
  const [open, setOpen] = useState(depth === 0)
  const children = row?.details || []
  const hasChildren = children.length > 0
  const isPercent = row?.type === 'percent'
  const value = valueOf(row, periodKey, keys)
  const strong = depth === 0 || row?.type === 'result' || row?.type === 'total'

  return (
    <>
      <button
        type="button"
        onClick={() => hasChildren && setOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center gap-2 border-b border-slate-100 py-3 text-left last:border-b-0',
          !hasChildren && 'cursor-default'
        )}
        style={{ paddingLeft: depth * 14 }}
      >
        {hasChildren ? (
          <ChevronRight
            size={16}
            aria-hidden="true"
            className={cn('shrink-0 text-slate-400 transition-transform', open && 'rotate-90')}
          />
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            strong ? 'text-[15px] font-semibold text-slate-900' : 'text-[14px] text-slate-600'
          )}
        >
          {row.name}
        </span>

        <span
          className={cn(
            'shrink-0 text-[14px] tabular-nums',
            strong ? 'font-bold text-slate-900' : 'font-medium text-slate-700',
            !isPercent && value < 0 && 'text-red-600'
          )}
        >
          {isPercent ? (
            value ? `${(Math.round(value * 10) / 10).toLocaleString('ru-RU')}%` : '—'
          ) : (
            <Money value={value} currency={currency} />
          )}
        </span>
      </button>

      {open &&
        children.map((child) => (
          <TreeRow
            key={child.id || child.name}
            row={child}
            periodKey={periodKey}
            keys={keys}
            currency={currency}
            depth={depth + 1}
          />
        ))}
    </>
  )
}

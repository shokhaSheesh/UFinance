'use client'

import Segmented from '@/components/shared/Segmented/Segmented'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { cn } from '@/lib/utils'
import { formatNumber, formatTotalSumma } from '@/utils/helpers'

/**
 * Общие части страниц отчётов (ДДС, P&L, баланс).
 *
 * Раньше отчёт был только таблицей: чтобы понять итог за период, нужно было
 * дойти глазами до правой колонки «Итого» нужной строки. Теперь над таблицей —
 * карточки главных строк отчёта с итогом и маленьким графиком по периодам,
 * а параметры (валюта, группировка, метод) — видимыми переключателями.
 */

const money = (value) => formatNumber(formatTotalSumma(value))

/** Подписанный параметр отчёта: «Валюта [UZS | USD]». */
export function ReportControl({ label, children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500">{label}</span>
      {children}
    </div>
  )
}

/**
 * Выбор из вариантов: до четырёх — переключателем (все видны сразу),
 * больше — выпадающим списком, чтобы не растягивать строку.
 */
export function ChoiceControl({ options = [], value, onChange, ariaLabel, selectWidth = 'w-32' }) {
  if (options.length > 0 && options.length <= 4) {
    return (
      <Segmented
        ariaLabel={ariaLabel}
        value={value}
        onChange={onChange}
        options={options.map((option) => ({ value: option.value, label: option.label ?? option.value }))}
      />
    )
  }
  return (
    <SingleSelect
      data={options}
      value={value}
      onChange={onChange}
      isClearable={false}
      withSearch={false}
      className={cn('bg-white', selectWidth)}
      wrapperClassName={cn(selectWidth, 'shrink-0')}
      dropdownClassName={selectWidth}
    />
  )
}

/**
 * Столбики по периодам. Плюс — зелёный, минус — красный; для остатков и
 * процентов (neutral) — синий. Ноль — без столбика.
 */
export function Sparkline({ values = [], neutral = false }) {
  const numbers = values.map((v) => Number(v) || 0)
  if (numbers.length === 0) return <div className="h-9" />

  const max = Math.max(...numbers.map(Math.abs), 1)
  const hasNegative = numbers.some((v) => v < 0)
  const hasPositive = numbers.some((v) => v > 0)
  const height = 36
  // Если есть и плюс, и минус — нулевая линия посередине
  const baseline = hasNegative && hasPositive ? height / 2 : hasNegative ? 0 : height
  const scale = hasNegative && hasPositive ? height / 2 : height
  const step = 100 / numbers.length
  const gap = Math.min(step * 0.25, 2)

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-9 w-full" aria-hidden="true">
      <line x1="0" x2="100" y1={baseline} y2={baseline} stroke="#e2e8f0" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
      {numbers.map((value, index) => {
        if (value === 0) return null
        const barHeight = Math.max((Math.abs(value) / max) * scale, 1)
        const y = value > 0 ? baseline - barHeight : baseline
        const fill = neutral ? '#0e73f6' : value > 0 ? '#059669' : '#dc2626'
        return (
          <rect
            key={index}
            x={index * step + gap / 2}
            y={y}
            width={Math.max(step - gap, 0.5)}
            height={barHeight}
            fill={fill}
            opacity="0.75"
            rx="0.6"
          />
        )
      })}
    </svg>
  )
}

/**
 * Карточки главных строк отчёта.
 * items: [{ key, name, total, values: number[], percent?, neutral?, emphasis? }]
 */
export function ReportSummaryStrip({ items = [], currency, firstLabel, lastLabel }) {
  if (items.length === 0) return null
  return (
    <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
      {items.map((item) => {
        const total = Number(item.total) || 0
        const tone =
          item.neutral || item.percent || total === 0
            ? 'text-slate-900'
            : total > 0
              ? 'text-emerald-700'
              : 'text-red-600'
        return (
          <div
            key={item.key}
            className={cn(
              'flex min-w-0 flex-col gap-2 rounded-xl border bg-white px-4 py-3.5',
              item.emphasis ? 'border-[#0e73f6]/50 bg-[#f8fbff]' : 'border-slate-200'
            )}
          >
            <span className="truncate text-sm font-medium text-slate-600" title={item.name}>
              {item.name}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className={cn('truncate text-xl font-semibold tabular-nums', tone)}>
                {total === 0 ? '0' : item.percent ? `${formatNumber(total)}%` : money(total)}
              </span>
              {!item.percent && currency && <span className="shrink-0 text-xs text-slate-400">{currency}</span>}
            </div>
            <Sparkline values={item.values} neutral={item.neutral || item.percent} />
            {(firstLabel || lastLabel) && (
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{firstLabel}</span>
                <span>{lastLabel}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Структура раздела баланса: итог и из чего он состоит — строки первого
 * уровня с долей от итога полосой.
 */
export function BalanceStructureCard({ title, total, parts = [], currency, accent = '#0e73f6' }) {
  const sum = Math.abs(Number(total) || 0)
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-base font-semibold text-slate-900">{title}</span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold tabular-nums text-slate-900">{sum ? money(total) : '0'}</span>
          {currency && <span className="text-sm text-slate-400">{currency}</span>}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {parts.map((part) => {
          const value = Number(part.value) || 0
          const share = sum ? Math.round((Math.abs(value) / sum) * 1000) / 10 : 0
          return (
            <div key={part.key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-slate-700">{part.name}</span>
                <span className="flex shrink-0 items-baseline gap-2">
                  <span className={cn('font-medium tabular-nums', value < 0 ? 'text-red-600' : 'text-slate-900')}>
                    {value ? money(value) : '0'}
                  </span>
                  <span className="w-12 text-right text-xs tabular-nums text-slate-400">{share}%</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${Math.min(share, 100)}%`, backgroundColor: accent }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Число в ячейке отчёта: отрицательные красным, чтобы минус не терялся. */
export const cellTone = (value) => ((Number(value) || 0) < 0 ? 'text-red-600' : '')

'use client'

import HintQuestion from '@/components/shared/HintQuestion'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { cn } from '@/lib/utils'
import { formatNumber, formatTotalSumma } from '@/utils/helpers'
import { useTranslations } from 'next-intl'

const money = (value) => formatNumber(formatTotalSumma(value, 0)) || '0'
const percent = (value) => (value == null ? '—' : `${(Math.round(value * 10) / 10).toLocaleString('ru-RU')}%`)

/** Карточка блока с заголовком и подписью. */
export function Block({ title, subtitle, hint, footer, className, children }) {
  return (
    <div className={cn('flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5', className)}>
      <div className="mb-4 flex items-start gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {hint && (
          <span className="mt-0.5 flex size-5 shrink-0 cursor-help items-center justify-center rounded-full bg-slate-100" title={hint}>
            <HintQuestion className="size-3 text-slate-400" />
          </span>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {footer && <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">{footer}</div>}
    </div>
  )
}

/**
 * Список «кто больше должен»: название, полоса доли от крупнейшего долга и
 * сумма. Так же, как в блоке «Долги» на «Показателях».
 */
export function RankedList({ items = [], color = '#3b82f6', empty }) {
  const max = Math.max(...items.map((item) => Math.abs(Number(item.total) || 0)), 1)
  const currency = GlobalCurrency?.name

  if (!items.length) return <div className="flex flex-1 items-center justify-center py-8 text-sm text-slate-400">{empty}</div>

  return (
    <ol className="flex flex-col gap-3">
      {items.map((item) => {
        const total = Number(item.total) || 0
        return (
          <li key={item.guid || item.name} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm text-slate-700" title={item.name}>{item.name}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                {money(total)} <span className="text-xs font-normal text-slate-400">{currency}</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${(Math.abs(total) / max) * 100}%`, background: color }} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Оборачиваемость: три числа в днях. */
export function TurnoverDays({ turnover }) {
  const t = useTranslations('Company')
  const boxes = [
    { key: 'dso', label: t('turnover.dso'), value: turnover.dso, tone: 'text-[#0e73f6]' },
    { key: 'dpo', label: t('turnover.dpo'), value: turnover.dpo, tone: 'text-slate-700' },
    { key: 'cycle', label: t('turnover.cycle'), value: turnover.cycle, tone: turnover.cycle > 0 ? 'text-amber-600' : 'text-emerald-700' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {boxes.map((box) => (
        <div key={box.key} className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-3">
          <div className={cn('text-2xl font-semibold tabular-nums', box.tone)}>
            {box.value == null ? '—' : t('turnover.days', { count: box.value })}
          </div>
          <div className="mt-1 text-xs text-slate-500">{box.label}</div>
        </div>
      ))}
    </div>
  )
}

/** Рентабельность проектов: полоса и процент, минус — красным. */
export function ProjectsRoi({ projects = [], empty }) {
  const t = useTranslations('Company')
  const max = Math.max(...projects.map((p) => Math.abs(Number(p.profitability) || 0)), 1)
  const currency = GlobalCurrency?.name

  if (!projects.length) return <div className="flex flex-1 items-center justify-center py-8 text-sm text-slate-400">{empty}</div>

  return (
    <ol className="flex flex-col gap-3">
      {projects.map((project) => {
        const value = Number(project.profitability) || 0
        return (
          <li key={project.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm text-slate-700" title={project.name}>{project.name}</span>
              <span className="flex shrink-0 items-baseline gap-2">
                <span className="text-xs tabular-nums text-slate-400">
                  {t('projects.profit')} {money(project.profit)} {currency}
                </span>
                <span className={cn('text-sm font-semibold tabular-nums', value < 0 ? 'text-red-600' : 'text-emerald-700')}>
                  {value > 0 ? '+' : ''}
                  {percent(project.profitability)}
                </span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn('h-full rounded-full', value < 0 ? 'bg-red-400' : 'bg-emerald-500')}
                style={{ width: `${Math.max(4, (Math.abs(value) / max) * 100)}%` }}
              />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Полоса «доля» с подписью и значением. */
export function RatioBar({ label, value, hint, barClass = 'bg-[#0e73f6]' }) {
  const width = value == null ? 0 : Math.max(0, Math.min(100, value))
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-slate-900">{percent(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-[width] duration-500', barClass)} style={{ width: `${width}%` }} />
      </div>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { formatDeviation, formatMoney, planExecution } from '@/modules/plans/utils/format'
import { useTranslations } from 'next-intl'

/**
 * План против факта по главным строкам бюджета (доходы, расходы, прибыль,
 * потоки…). Итоги за весь период — те же, что в колонке «Итого» таблицы:
 * факт крупно, план мельче, полоса выполнения плана и отклонение.
 *
 * Отклонение берётся как пришло с бэка (`plan.profit`): его знак уже
 * учитывает, доходная строка или расходная.
 */
export default function BudgetPlanFactCards({ rows = [], hiddenRowIds = [], currency }) {
  const t = useTranslations('Plans.budgetDetail')
  const items = rows.filter((row) => !row.isPercent && !hiddenRowIds.includes(row.id))
  if (!items.length) return null

  return (
    <div className="grid shrink-0 grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 px-6 pb-4">
      {items.map((row) => {
        const { plan, fact, profit } = row.periodTotals || {}
        const execution = planExecution(plan, fact)
        const width = Math.max(0, Math.min(100, execution))
        return (
          <div key={row.id} className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <span className="truncate text-sm font-medium text-slate-600" title={row.label}>{row.label}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="truncate text-xl font-semibold tabular-nums text-slate-900">{formatMoney(fact)}</span>
              {currency && <span className="shrink-0 text-xs text-slate-400">{currency}</span>}
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
              <span className="truncate">
                {t('plan')}: <span className="tabular-nums text-slate-700">{plan ? formatMoney(plan) : t('noPlan')}</span>
              </span>
              {!!plan && <span className="shrink-0 font-medium tabular-nums text-slate-700">{Math.round(execution)}%</span>}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" title={t('execution')}>
              <div
                className={cn('h-full rounded-full', !plan ? 'bg-slate-200' : width >= 100 ? 'bg-emerald-600' : 'bg-[#0e73f6]')}
                style={{ width: `${plan ? width : 0}%` }}
              />
            </div>
            <span
              className={cn(
                'text-xs tabular-nums',
                !profit ? 'text-slate-400' : profit > 0 ? 'text-emerald-700' : 'text-red-600'
              )}
            >
              {t('deviation')} {formatDeviation(profit || 0)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

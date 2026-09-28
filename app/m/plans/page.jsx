'use client'

import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import { cn } from '@/lib/utils'
import { useBudgets } from '@/modules/plans/hooks/useBudgets'
import { appStore } from '@/store/app.store'
import { CalendarRange, ClipboardList, Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Планы на телефоне: бюджеты доходов и расходов и бюджеты движения денег.
 *
 * На большом экране это две страницы с таблицами. Здесь один экран с
 * переключателем вида бюджета: бюджет — карточка с периодом и полосой,
 * по которой видно, сколько месяцев уже прошло. Правка плана по месяцам
 * остаётся на компьютере: это таблица на двенадцать колонок.
 */

/** Месяц в виде числа: год × 12 + месяц. */
const monthIndex = (value) => {
  if (!value) return null
  const [year, month] = String(value).split('-').map(Number)
  if (!year || !month) return null
  return year * 12 + (month - 1)
}

/** Где бюджет во времени и сколько месяцев из него прошло. */
const getTimeline = (period) => {
  const start = monthIndex(period?.start)
  const end = monthIndex(period?.end)
  if (start == null || end == null) return { status: null, done: 0, total: 0 }
  const now = new Date()
  const current = now.getFullYear() * 12 + now.getMonth()
  const total = end - start + 1
  if (current < start) return { status: 'planned', done: 0, total }
  if (current > end) return { status: 'done', done: total, total }
  return { status: 'active', done: current - start + 1, total }
}

const STATUS_STYLE = {
  active: 'bg-[#e8f1ff] text-[#0e73f6]',
  planned: 'bg-amber-50 text-amber-700',
  done: 'bg-slate-100 text-slate-500',
}

const BAR_STYLE = {
  active: 'bg-[#0e73f6]',
  planned: 'bg-amber-400',
  done: 'bg-slate-400',
}

const MobilePlansPage = observer(() => {
  const t = useTranslations('Mobile')
  const tb = useTranslations('Plans.budgetList')
  const tPnl = useTranslations('Plans.incomeExpenseBudget')
  const tCash = useTranslations('Plans.cashFlowBudget')
  const router = useRouter()

  const [type, setType] = useState('pnl')
  const { budgets, isLoading } = useBudgets(type)

  const permissions = appStore.permission.plans?.[type] || {}

  const items = useMemo(
    () =>
      budgets.map((budget) => ({
        ...budget,
        timeline: getTimeline(budget.periodValue),
      })),
    [budgets]
  )

  const tabs = [
    { value: 'pnl', label: tPnl('title') },
    { value: 'cashflow', label: tCash('title') },
  ]

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader title={t('plans.title')} onBack={() => router.push('/m/profile')} />

        {/* Какой бюджет смотрим */}
        <div className="flex rounded-2xl bg-white p-1">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setType(item.value)}
              className={cn(
                'min-w-0 flex-1 truncate rounded-xl px-2 py-2.5 text-[13px] font-semibold',
                type === item.value ? 'bg-[#0e73f6] text-white' : 'text-slate-500'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2.5 pb-28">
        {isLoading && !items.length && (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
          </div>
        )}

        {!isLoading && !items.length && <MEmpty icon={ClipboardList} title={t('plans.empty')} />}

        {!permissions?.read && !isLoading && items.length > 0 && (
          <MEmpty icon={ClipboardList} title={t('plans.noAccess')} />
        )}

        <div className="flex flex-col gap-2.5">
          {items.map((budget) => {
            const { status, done, total } = budget.timeline
            const percent = total ? Math.round((done / total) * 100) : 0
            return (
              <MCard key={budget.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <CalendarRange size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-slate-900">{budget.name}</span>
                    <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                      {[budget.legalEntity, budget.project, budget.currency].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  {status && (
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                        STATUS_STYLE[status]
                      )}
                    >
                      {tb(`status.${status}`)}
                    </span>
                  )}
                </div>

                {/* Сколько месяцев периода прошло */}
                {total > 0 && (
                  <div className="mt-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[11px] text-slate-400">
                        {t('plans.months', { done, total })}
                      </span>
                      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-500">{percent}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={cn('h-full rounded-full', BAR_STYLE[status])} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )}
              </MCard>
            )
          })}
        </div>

        <p className="px-2 pt-4 text-[11px] leading-relaxed text-slate-400">{t('plans.hint')}</p>
      </div>
    </div>
  )
})

export default MobilePlansPage

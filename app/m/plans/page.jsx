'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import BudgetFormSheet from '@/components/mobile/forms/BudgetFormSheet'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import { cn } from '@/lib/utils'
import { useBudgets, useDeleteBudget } from '@/modules/plans/hooks/useBudgets'
import { appStore } from '@/store/app.store'
import { CalendarDays, CalendarRange, ChevronRight, ClipboardList, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

/**
 * Планы на телефоне: бюджеты доходов и расходов и бюджеты движения денег.
 *
 * На большом экране это две страницы с таблицами. Здесь один экран с
 * переключателем вида бюджета: бюджет — карточка с периодом и полосой,
 * по которой видно, сколько месяцев уже прошло; касание открывает бюджет
 * с планом и фактом по статьям. Сверху — вход в платёжный календарь.
 * Вид бюджета хранится в адресе (?type=cashflow), чтобы «назад» из
 * бюджета возвращал в тот же список.
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
  const tc = useTranslations('Common')
  const tPnl = useTranslations('Plans.incomeExpenseBudget')
  const tCash = useTranslations('Plans.cashFlowBudget')
  const tr = useTranslations('Reports')
  const router = useRouter()
  const searchParams = useSearchParams()

  const type = searchParams.get('type') === 'cashflow' ? 'cashflow' : 'pnl'
  const setType = (next) => router.replace(next === 'cashflow' ? '/m/plans?type=cashflow' : '/m/plans')
  const [formFor, setFormFor] = useState(null)
  const [menuFor, setMenuFor] = useState(null)
  const [deleteFor, setDeleteFor] = useState(null)
  const deleteMutation = useDeleteBudget(type)
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
        <MScreenHeader
          title={t('plans.title')}
          onBack={() => router.push('/m/profile')}
          action={
            permissions?.add && (
              <button
                type="button"
                onClick={() => setFormFor({})}
                aria-label={tc('create')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0e73f6] text-white active:bg-[#0b5fd4]"
              >
                <Plus size={19} aria-hidden="true" />
              </button>
            )
          }
        />

      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2.5 pb-28">
        {/* Платёжный календарь — не бюджет, а отчёт по периодам; отдельный вход */}
        <button
          type="button"
          onClick={() => router.push('/m/plans/calendar')}
          className="mb-2.5 flex w-full items-center gap-3 rounded-[24px] bg-white p-4 text-left active:bg-slate-50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[#0e73f6]">
            <CalendarDays size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-slate-900">{tr('paymentCalendar.title')}</span>
            <span className="mt-0.5 block truncate text-[12px] text-slate-500">{t('plans.calendarHint')}</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-slate-300" aria-hidden="true" />
        </button>

        <div className="px-1 pt-2 pb-2.5 text-[15px] font-bold text-slate-900">{t('plans.budgets')}</div>
        {/* Какой бюджет смотрим */}
        <div className="mb-2.5 flex rounded-2xl bg-white p-1">
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
              <MCard
                key={budget.id}
                className="cursor-pointer p-4 active:bg-slate-50"
                onClick={() => router.push(`/m/plans/${type}/${budget.id}`)}
              >
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
                  {(permissions?.edit || permissions?.delete) && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setMenuFor(budget)
                      }}
                      aria-label={tc('edit')}
                      className="-mr-1 flex h-8 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400"
                    >
                      <MoreHorizontal size={17} aria-hidden="true" />
                    </button>
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

      {/* Что сделать с бюджетом */}
      <BottomSheet open={Boolean(menuFor)} onClose={() => setMenuFor(null)} title={menuFor?.name}>
        <div className="flex flex-col">
          {permissions?.edit && (
            <button
              type="button"
              onClick={() => {
                setFormFor(menuFor)
                setMenuFor(null)
              }}
              className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left active:bg-slate-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Pencil size={18} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold text-slate-900">{tc('edit')}</span>
            </button>
          )}
          {permissions?.delete && (
            <button
              type="button"
              onClick={() => {
                setDeleteFor(menuFor)
                setMenuFor(null)
              }}
              className="flex items-center gap-3 py-3.5 text-left active:bg-red-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={18} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold text-red-600">{tc('delete')}</span>
            </button>
          )}
        </div>
      </BottomSheet>

      <BudgetFormSheet
        open={Boolean(formFor)}
        budget={formFor?.id ? formFor : null}
        type={type}
        onClose={() => setFormFor(null)}
      />

      <BottomSheet
        open={Boolean(deleteFor)}
        onClose={() => setDeleteFor(null)}
        title={tc('delete')}
        footer={
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setDeleteFor(null)}
              className="h-12 flex-1 rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700"
            >
              {tc('cancel')}
            </button>
            <button
              type="button"
              onClick={async () => {
                await deleteMutation.mutateAsync(deleteFor.id)
                setDeleteFor(null)
              }}
              disabled={deleteMutation.isPending}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 text-[15px] font-semibold text-white disabled:opacity-60"
            >
              {deleteMutation.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {tc('delete')}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">{deleteFor?.name}</p>
      </BottomSheet>
    </div>
  )
})

export default MobilePlansPage

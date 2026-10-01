'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import BudgetFormSheet from '@/components/mobile/forms/BudgetFormSheet'
import SwipeCards from '@/components/mobile/SwipeCards'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { useRouter } from '@/hooks/useAppRouter'
import { cn } from '@/lib/utils'
import { showSuccessNotification } from '@/lib/utils/notifications'
import { formatPeriodLabel } from '@/modules/plans/hooks/useBudgetList'
import { useBudget, useBudgetPlan, useDeleteBudget, useSaveBudgetPlan } from '@/modules/plans/hooks/useBudgets'
import { buildBudgetPeriod, buildBudgetRows, hiddenRowIdsFor } from '@/modules/plans/utils/budgetTree'
import { deviation, formatDeviation, parseInputNumber, planExecution, toInputValue } from '@/modules/plans/utils/format'
import { appStore } from '@/store/app.store'
import { ChevronDown, ChevronRight, ClipboardList, Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Бюджет на телефоне — БДР или БДДС.
 *
 * На компьютере это таблица: статьи строками, месяцы колонками, в каждой
 * план, факт и отклонение. На 390 точках таких колонок не поместить,
 * поэтому период выбирается сверху (весь период или один месяц), а
 * статьи идут списком: факт крупно, план и выполнение под ним. План
 * правится касанием по статье — в панели снизу, для выбранного месяца.
 * Данные и запись — те же get_budget_plan и create_budget_plan.
 */

const TOTAL = 'total'
const PROFIT_OPTIONS = ['operating', 'ebitda', 'ebit', 'ebt']

/** Значения строки в выбранной колонке: за весь период или за месяц. */
const metricsOf = (row, column) => (column === TOTAL ? row.periodTotals : row.apiTotals?.[column]) || {}

/** Собственный план статьи — его и пишет create_budget_plan. */
const ownPlanOf = (row, column) => (column === TOTAL ? row.periodOwnPlan : row.values?.[column]?.plan) || 0

/** Строка статьи с подстатьями под ней. */
const BudgetRow = ({ row, depth, column, expanded, onToggle, onEdit, canEdit, hiddenIds, currency, td }) => {
  if (hiddenIds.includes(row.id)) return null
  const metrics = metricsOf(row, column)
  const hasChildren = Boolean(row.children?.length)
  const isOpen = expanded[row.id] ?? depth === 0
  const execution = planExecution(metrics.plan, metrics.fact)
  const dev = deviation(metrics)
  const editable = canEdit(row)

  return (
    <>
      <div
        className={cn(
          'flex items-start gap-2 border-b border-slate-100 py-3 last:border-b-0',
          row.bold && depth === 0 && 'bg-slate-50/60'
        )}
        style={{ paddingLeft: depth * 14 }}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggle(row.id, !isOpen)}
          className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-slate-400', !hasChildren && 'invisible')}
          aria-label={row.label}
        >
          {isOpen ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
        </button>

        <button
          type="button"
          onClick={() => onEdit(row)}
          className={cn('flex min-w-0 flex-1 items-start gap-3 text-left', editable && 'active:opacity-70')}
        >
          <span className="min-w-0 flex-1">
            <span className={cn('block text-[14px] leading-snug text-slate-900', row.bold ? 'font-bold' : 'font-medium')}>
              {row.label}
            </span>
            {!row.isPercent && (
              <span className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="truncate">
                  {td('plan')}: <Money value={metrics.plan || 0} currency="" />
                </span>
                {!!metrics.plan && <span className="shrink-0 font-semibold text-slate-600">· {Math.round(execution)}%</span>}
                {editable && <Pencil size={11} className="shrink-0 text-[#0e73f6]" aria-hidden="true" />}
              </span>
            )}
          </span>
          <span className="shrink-0 text-right">
            <span className={cn('block text-[14px] tabular-nums text-slate-900', row.bold ? 'font-bold' : 'font-semibold')}>
              {row.isPercent ? `${Math.round((metrics.fact || 0) * 10) / 10}%` : <Money value={metrics.fact || 0} currency={currency} />}
            </span>
            {!row.isPercent && !!dev && (
              <span className={cn('mt-0.5 block text-[11px] tabular-nums', dev > 0 ? 'text-emerald-600' : 'text-red-600')}>
                {formatDeviation(dev)}
              </span>
            )}
          </span>
        </button>
      </div>

      {hasChildren &&
        isOpen &&
        row.children.map((child) => (
          <BudgetRow
            key={child.id}
            row={child}
            depth={depth + 1}
            column={column}
            expanded={expanded}
            onToggle={onToggle}
            onEdit={onEdit}
            canEdit={canEdit}
            hiddenIds={hiddenIds}
            currency={currency}
            td={td}
          />
        ))}
    </>
  )
}

const BudgetDetailScreen = observer(({ type = 'pnl', id }) => {
  const isPnl = type === 'pnl'
  const t = useTranslations(isPnl ? 'Plans.IncomeExpenseBudgetSingle' : 'Plans.CashFlowBudgetSingle')
  const tPnl = useTranslations('Plans.IncomeExpenseBudgetSingle')
  const td = useTranslations('Plans.budgetDetail')
  const tm = useTranslations('Mobile')
  const tc = useTranslations('Common')
  const router = useRouter()

  const [method, setMethod] = useState('accrual')
  const [indicators, setIndicators] = useState([])
  const [column, setColumn] = useState(TOTAL)
  const [expanded, setExpanded] = useState({})
  const [sheet, setSheet] = useState(null) // actions | delete
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null) // { row, value }

  const permissions = appStore.permission?.plans?.[type] || {}
  const listHref = `/m/plans?type=${type}`

  const { budget } = useBudget(id, type)
  const { data, isLoading } = useBudgetPlan(id, isPnl ? { accountingMethod: method, profitIndicators: indicators } : {})
  const savePlan = useSaveBudgetPlan(id)
  const deleteBudget = useDeleteBudget(type)

  const monthLabels = useMemo(
    () => Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, t(`monthsShort.${i + 1}`)])),
    [t]
  )
  const rows = useMemo(() => buildBudgetRows(data?.rows, data?.legend), [data])
  const period = useMemo(() => buildBudgetPeriod(data?.period, data?.legend) || budget?.periodValue || null, [data, budget])
  const hiddenIds = useMemo(() => (isPnl ? hiddenRowIdsFor(rows, indicators, PROFIT_OPTIONS) : []), [isPnl, rows, indicators])
  const currency = data?.currency_code || budget?.currency || ''

  const monthTitle = (key) => {
    const [year, month] = String(key).split('-')
    return `${monthLabels[Number(month)]} '${String(year).slice(2)}`
  }
  const columns = useMemo(
    () => [{ key: TOTAL, title: tm('plans.wholePeriod') }, ...(data?.legend || []).map((item) => ({ key: item.key, title: monthTitle(item.key) }))],
    // monthTitle зависит только от monthLabels
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, monthLabels, tm]
  )
  const columnTitle = columns.find((item) => item.key === column)?.title || ''

  // План на весь период правится, только если это включено в настройках —
  // как колонка «Итого» на компьютере
  const totalEditable = Boolean(appStore.planTotalActive)
  const canEdit = (row) =>
    Boolean(permissions.edit) &&
    row.editable !== false &&
    !row.isPercent &&
    row.apiType !== 'result' &&
    row.apiType !== 'total' &&
    (column !== TOTAL || totalEditable)

  const openEdit = (row) => {
    if (!canEdit(row)) return
    setEditing({ row, value: toInputValue(ownPlanOf(row, column)) })
  }

  const saveEdit = async () => {
    const amount = parseInputNumber(editing.value) ?? 0
    await savePlan.mutateAsync({ rowId: editing.row.id, ...(column !== TOTAL ? { month: column } : {}), amount })
    showSuccessNotification(tm('plans.planSaved'))
    setEditing(null)
  }

  const cards = rows.filter((row) => !row.isPercent && !hiddenIds.includes(row.id))
  const pills = [t('typeLabel'), period ? formatPeriodLabel(period, monthLabels) : null, currency].filter(Boolean)

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader
        title={budget?.name || ''}
        onBack={() => router.push(listHref)}
        action={
          (permissions.edit || permissions.delete) && (
            <button
              type="button"
              onClick={() => setSheet('actions')}
              aria-label={tc('actions')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 active:bg-slate-100"
            >
              <MoreHorizontal size={19} aria-hidden="true" />
            </button>
          )
        }
      />

      <div className="-mt-1 mb-3 flex flex-wrap gap-1.5">
        {pills.map((pill) => (
          <span key={pill} className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-slate-600">
            {pill}
          </span>
        ))}
        {budget?.legalEntity && (
          <span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-slate-600">{budget.legalEntity}</span>
        )}
      </div>

      {/* Период: весь бюджет или один месяц */}
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-1.5">
          {columns.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setColumn(item.key)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap',
                column === item.key ? 'bg-[#0e73f6] text-white' : 'bg-white text-slate-600'
              )}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      {/* Метод учёта и показатели прибыли — только у БДР */}
      {isPnl && (
        <div className="mt-2.5 flex flex-col gap-2">
          <div className="flex rounded-2xl bg-white p-1">
            {['accrual', 'cash'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMethod(value)}
                className={cn(
                  'min-w-0 flex-1 truncate rounded-xl py-2 text-[13px] font-semibold',
                  method === value ? 'bg-slate-900 text-white' : 'text-slate-500'
                )}
              >
                {tPnl(`method.${value}`)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROFIT_OPTIONS.map((key) => {
              const active = indicators.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIndicators((prev) => (active ? prev.filter((item) => item !== key) : [...prev, key]))}
                  aria-pressed={active}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[12px] font-semibold',
                    active ? 'bg-[#e8f1ff] text-[#0e73f6] ring-1 ring-[#0e73f6]/30' : 'bg-white text-slate-500'
                  )}
                >
                  {tPnl(`profitIndicators.${key}`)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
        </div>
      )}

      {!isLoading && rows.length === 0 && <MEmpty icon={ClipboardList} title={t('empty')} />}

      {!isLoading && rows.length > 0 && (
        <>
          {/* План против факта по главным строкам — листаются */}
          <div className="px-1 pt-5 pb-2.5 text-[15px] font-bold text-slate-900">{columnTitle}</div>
          <SwipeCards>
            {cards.map((row) => {
              const metrics = metricsOf(row, column)
              const execution = planExecution(metrics.plan, metrics.fact)
              const dev = deviation(metrics)
              const width = Math.max(0, Math.min(100, execution))
              return (
                <MCard key={row.id} className="flex h-full flex-col">
                  <span className="truncate text-[13px] font-semibold text-slate-500">{row.label}</span>
                  <span className="mt-2 truncate text-[22px] leading-tight font-bold text-slate-900">
                    <Money value={metrics.fact || 0} currency={currency} />
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-[12px] text-slate-500">
                    <span className="truncate">
                      {td('plan')}: {metrics.plan ? <Money value={metrics.plan} currency="" /> : td('noPlan')}
                    </span>
                    {!!metrics.plan && <span className="shrink-0 font-semibold text-slate-700">{Math.round(execution)}%</span>}
                  </span>
                  <div className="mt-auto pt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn('h-full rounded-full', width >= 100 ? 'bg-emerald-500' : 'bg-[#0e73f6]')}
                        style={{ width: `${metrics.plan ? width : 0}%` }}
                      />
                    </div>
                    <span className={cn('mt-2 block text-[12px] tabular-nums', !dev ? 'text-slate-400' : dev > 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {td('deviation')} {formatDeviation(dev || 0)}
                    </span>
                  </div>
                </MCard>
              )
            })}
          </SwipeCards>

          {/* Статьи бюджета */}
          <div className="flex items-baseline justify-between gap-3 px-1 pt-6 pb-2.5">
            <span className="text-[15px] font-bold text-slate-900">{budget?.legalEntity || t('allLegalEntities')}</span>
            <span className="shrink-0 text-[11px] text-slate-400">
              {tm('plans.factLabel')} · {td('deviation')}
            </span>
          </div>
          {permissions.edit && column === TOTAL && !totalEditable && (
            <p className="mb-2 rounded-2xl bg-[#e8f1ff] px-4 py-2.5 text-[12px] text-[#0e73f6]">{tm('plans.pickMonth')}</p>
          )}
          <MCard list className="px-3">
            {rows.map((row) => (
              <BudgetRow
                key={row.id}
                row={row}
                depth={0}
                column={column}
                expanded={expanded}
                onToggle={(rowId, open) => setExpanded((prev) => ({ ...prev, [rowId]: open }))}
                onEdit={openEdit}
                canEdit={canEdit}
                hiddenIds={hiddenIds}
                currency={currency}
                td={td}
              />
            ))}
          </MCard>
          <p className="px-2 pt-3 text-[11px] leading-relaxed text-slate-400">{tm('plans.hint')}</p>
        </>
      )}

      {/* Правка плана */}
      <BottomSheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.row?.label}
        subtitle={tm('plans.planFor', { period: columnTitle })}
        footer={
          <button
            type="button"
            onClick={saveEdit}
            disabled={savePlan.isPending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0e73f6] text-[15px] font-semibold text-white disabled:opacity-60"
          >
            {savePlan.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {tc('save')}
          </button>
        }
      >
        {editing && (
          <div className="rounded-[24px] bg-slate-50 px-4 py-5 text-center">
            <div className="text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">{td('plan')}</div>
            <div className="mt-2 flex items-baseline justify-center gap-2">
              <input
                autoFocus
                inputMode="decimal"
                value={editing.value}
                onChange={(event) => setEditing((prev) => ({ ...prev, value: event.target.value }))}
                placeholder="0"
                className="min-w-0 max-w-full bg-transparent text-center text-[34px] leading-none font-bold tabular-nums text-slate-900 outline-none placeholder:text-slate-300"
                style={{ width: `${Math.max(String(editing.value || '0').length, 1)}ch` }}
              />
              <span className="shrink-0 text-lg font-semibold text-slate-400">{currency}</span>
            </div>
            <div className="mt-3 text-[12px] text-slate-500">
              {td('fact')}: <Money value={metricsOf(editing.row, column).fact || 0} currency={currency} />
            </div>
          </div>
        )}
      </BottomSheet>

      {/* «…» бюджета */}
      <BottomSheet open={sheet === 'actions'} onClose={() => setSheet(null)} title={budget?.name}>
        <div className="flex flex-col">
          {permissions.edit && (
            <button
              type="button"
              onClick={() => {
                setSheet(null)
                setFormOpen(true)
              }}
              className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Pencil size={18} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold text-slate-900">{tc('edit')}</span>
            </button>
          )}
          {permissions.delete && (
            <button
              type="button"
              onClick={() => setSheet('delete')}
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

      <BottomSheet
        open={sheet === 'delete'}
        onClose={() => setSheet(null)}
        title={tc('delete')}
        footer={
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setSheet(null)} className="h-12 flex-1 rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700">
              {tc('cancel')}
            </button>
            <button
              type="button"
              onClick={async () => {
                await deleteBudget.mutateAsync(id)
                router.push(listHref)
              }}
              disabled={deleteBudget.isPending}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 text-[15px] font-semibold text-white disabled:opacity-60"
            >
              {deleteBudget.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {tc('delete')}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">{budget?.name}</p>
      </BottomSheet>

      <BudgetFormSheet open={formOpen} budget={budget} type={type} onClose={() => setFormOpen(false)} />
    </div>
  )
})

export default BudgetDetailScreen

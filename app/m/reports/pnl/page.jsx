'use client'

import PeriodBars from '@/components/mobile/PeriodBars'
import ReportPeriodSheet from '@/components/mobile/ReportPeriodSheet'
import { findRow, ReportTile, TOTAL_KEY, TreeRow, valueOf } from '@/components/mobile/ReportTree'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import { pnlStore } from '@/components/reports/profit-and-loss/pnl.store'
import { useRouter } from '@/hooks/useAppRouter'
import { apiClient } from '@/lib/api/ucode/base'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, CalendarDays, Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useMemo, useState } from 'react'

/**
 * Прибыли и убытки на телефоне.
 *
 * Устроен так же, как отчёт о движении денег: период выбирается сверху,
 * под ним четыре итога этого периода, ниже — статьи деревом. Отличаются
 * только показатели: выручка, расходы, прибыль и рентабельность.
 */
const MobilePnlPage = observer(() => {
  const t = useTranslations('Reports')
  const tm = useTranslations('Mobile')
  const router = useRouter()
  const [periodKey, setPeriodKey] = useState(null)
  const [periodOpen, setPeriodOpen] = useState(false)

  const {
    dateRange,
    selectedGrouping,
    selectedCurrency,
    isCalculation,
    selectedAccounts,
    selectedCounterparties,
    selectedLegalEntities,
    selectedProjects,
    ebitda,
    ebit,
    ebt,
  } = pnlStore

  const filterData = {
    periodStartDate: moment(dateRange?.start).format('YYYY-MM-DD'),
    periodEndDate: moment(dateRange?.end).format('YYYY-MM-DD'),
    periodType: selectedGrouping,
    userCurrencyCode: selectedCurrency,
    accounting_method: isCalculation,
    my_accounts_ids: selectedAccounts,
    counterparties_ids: selectedCounterparties,
    legal_entity_ids: selectedLegalEntities,
    project_ids: selectedProjects,
    isEbitda: ebitda,
    isEbit: ebit,
    isEbt: ebt,
    limit: 100,
    page: 1,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['profit_and_loss', filterData],
    queryFn: () => apiClient.invokeFunction({ method: 'profit_and_loss', data: filterData }),
    select: (response) => response?.data?.data,
    refetchOnWindowFocus: false,
  })

  const legend = useMemo(() => data?.legend || [], [data])
  const keys = useMemo(() => legend.map((item) => item.key), [legend])
  const rows = useMemo(() => data?.rows || [], [data])
  const activeKey = periodKey || keys[keys.length - 1] || TOTAL_KEY

  const incomeRow = useMemo(
    () => findRow(rows, (row) => row?.id === 'income' || row?.name === 'income' || row?.type === 'income'),
    [rows]
  )
  const expenseRow = useMemo(
    () => findRow(rows, (row) => row?.id === 'expenses' || row?.name === 'expenses' || row?.type === 'expenses'),
    [rows]
  )

  /** Столбики: выручка и расходы каждого периода. */
  const bars = useMemo(
    () =>
      legend.map((item) => ({
        key: item.key,
        title: item.title,
        up: incomeRow ? valueOf(incomeRow, item.key, keys) : 0,
        down: expenseRow ? valueOf(expenseRow, item.key, keys) : 0,
      })),
    [legend, incomeRow, expenseRow, keys]
  )

  const groupingOptions = useMemo(
    () => [
      { value: 'daily', label: t('pnl.grouping.daily') },
      { value: 'weekly', label: t('pnl.grouping.weekly') },
      { value: 'monthly', label: t('pnl.grouping.monthly') },
    ],
    [t]
  )

  const activeTitle =
    activeKey === TOTAL_KEY ? t('common.total') : legend.find((item) => item.key === activeKey)?.title || ''

  const summary = useMemo(() => {
    const isIncome = (row) => row?.id === 'income' || row?.name === 'income' || row?.type === 'income'
    const isExpense = (row) => row?.id === 'expenses' || row?.name === 'expenses' || row?.type === 'expenses'
    const income = findRow(rows, isIncome)
    const expenses = findRow(rows, isExpense)
    // чистая прибыль — последняя итоговая строка отчёта
    const resultRows = rows.filter((row) => row?.type === 'result' || row?.type === 'total')
    const profitRow = resultRows[resultRows.length - 1]

    const revenue = income ? valueOf(income, activeKey, keys) : 0
    const cost = expenses ? valueOf(expenses, activeKey, keys) : 0
    const profit = profitRow ? valueOf(profitRow, activeKey, keys) : revenue - cost

    return { revenue, cost, profit, margin: revenue ? (profit / revenue) * 100 : null }
  }, [rows, activeKey, keys])

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader title={t('pnl.title')} onBack={() => router.push('/m/reports')} />

      <button
        type="button"
        onClick={() => setPeriodOpen(true)}
        className="flex w-full items-center gap-2 rounded-2xl bg-white px-4 py-3 text-left active:bg-slate-50"
      >
        <CalendarDays size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-slate-900">
          {[dateRange?.start, dateRange?.end]
            .filter(Boolean)
            .map((date) => moment(date).format('DD.MM.YYYY'))
            .join(' — ')}
        </span>
        <span className="shrink-0 text-[13px] font-semibold text-[#0e73f6]">
          {groupingOptions.find((option) => option.value === selectedGrouping)?.label}
        </span>
      </button>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
        </div>
      )}

      {!isLoading && rows.length === 0 && <MEmpty icon={BarChart3} title={tm('reports.noData')} />}

      {!isLoading && rows.length > 0 && (
        <>
          <div className="pt-3">
            <PeriodBars periods={bars} value={activeKey} onChange={setPeriodKey} />
            <button
              type="button"
              onClick={() => setPeriodKey(TOTAL_KEY)}
              className={cn(
                'mt-2 w-full rounded-full py-2 text-[13px] font-semibold',
                activeKey === TOTAL_KEY ? 'bg-[#0e73f6] text-white' : 'bg-white text-slate-600'
              )}
            >
              {t('common.total')}
            </button>
          </div>

          <div className="px-1 pt-5 pb-2.5 text-[15px] font-bold text-slate-900">{activeTitle}</div>
          <div className="grid grid-cols-2 gap-2.5">
            <ReportTile label={tm('home.income')} value={summary.revenue} currency={selectedCurrency} tone="in" />
            <ReportTile label={tm('home.expense')} value={summary.cost} currency={selectedCurrency} tone="out" />
            <ReportTile
              label={tm('home.profit')}
              value={summary.profit}
              currency={selectedCurrency}
              tone={summary.profit >= 0 ? 'in' : 'out'}
            />
            <ReportTile
              label={tm('reports.margin')}
              value={summary.margin}
              percent
              tone={summary.margin >= 0 ? 'in' : 'out'}
            />
          </div>

          <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{t('pnl.article')}</div>
          <MCard list>
            {rows.map((row) => (
              <TreeRow
                key={row.id || row.name}
                row={row}
                periodKey={activeKey}
                keys={keys}
                currency={selectedCurrency}
              />
            ))}
          </MCard>

          <p className="px-2 pt-3 text-[11px] leading-relaxed text-slate-400">{tm('reports.tableHint')}</p>
        </>
      )}

      <ReportPeriodSheet
        open={periodOpen}
        onClose={() => setPeriodOpen(false)}
        start={dateRange?.start}
        end={dateRange?.end}
        grouping={selectedGrouping}
        groupingOptions={groupingOptions}
        onApply={({ start, end, grouping }) => {
          pnlStore.setDateRange({ start, end })
          pnlStore.setSelectedGrouping(grouping)
          setPeriodKey(null)
        }}
      />
    </div>
  )
})

export default MobilePnlPage

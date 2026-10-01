'use client'

import PeriodBars from '@/components/mobile/PeriodBars'
import ReportPeriodSheet from '@/components/mobile/ReportPeriodSheet'
import { collectRows, findRow, ReportTile, TOTAL_KEY, TreeRow, valueOf } from '@/components/mobile/ReportTree'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import { cashFlowStore } from '@/components/reports/cashflow/cashflow.store'
import { useRouter } from '@/hooks/useAppRouter'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Loader2, TrendingUp } from '@/components/mobile/icons'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Движение денег на телефоне.
 *
 * Настольный отчёт — таблица со статьями слева и колонкой на каждый месяц.
 * Здесь вместо колонок столбики: высота показывает, сколько пришло и ушло,
 * а нажатие выбирает период, цифры которого разбираются ниже — четыре
 * итога и дерево статей. Период и разбивку меняет одна панель.
 */
const MobileCashflowPage = observer(() => {
  const t = useTranslations('Reports')
  const tm = useTranslations('Mobile')
  const router = useRouter()
  const [periodKey, setPeriodKey] = useState(null)
  const [periodOpen, setPeriodOpen] = useState(false)

  const {
    periodStartDate,
    periodEndDate,
    periodType,
    currencyCode,
    sellingDealId,
    contrAgentId,
    accountId,
    dealId,
    projectId,
  } = cashFlowStore

  const filterData = {
    periodStartDate: periodStartDate ? moment(periodStartDate).format('YYYY-MM-DD') : null,
    periodEndDate: periodEndDate ? moment(periodEndDate).format('YYYY-MM-DD') : null,
    periodType,
    currencyCode,
    sellingDealId,
    contrAgentId,
    accountId,
    dealId,
    project_ids: projectId,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['cash_flow', filterData],
    queryFn: () => apiClient.invokeFunction({ method: 'cash_flow', data: filterData }),
    select: (response) => response?.data?.data,
    refetchOnWindowFocus: false,
  })

  const legend = useMemo(() => data?.legend || [], [data])
  const keys = useMemo(() => legend.map((item) => item.key), [legend])
  const rows = useMemo(() => data?.rows || [], [data])
  const activeKey = periodKey || keys[keys.length - 1] || TOTAL_KEY

  const receiptRows = useMemo(() => collectRows(rows, 'Поступления'), [rows])
  const paymentRows = useMemo(() => collectRows(rows, 'Выплаты'), [rows])

  /** Столбики: сколько пришло и ушло в каждом периоде. */
  const bars = useMemo(
    () =>
      legend.map((item) => ({
        key: item.key,
        title: item.title,
        up: receiptRows.reduce((sum, row) => sum + valueOf(row, item.key, keys), 0),
        down: paymentRows.reduce((sum, row) => sum + valueOf(row, item.key, keys), 0),
      })),
    [legend, receiptRows, paymentRows, keys]
  )

  const summary = useMemo(() => {
    const sum = (list) => list.reduce((total, row) => total + valueOf(row, activeKey, keys), 0)
    const net = findRow(rows, (row) => row?.id === 'overall-cash-flow' || row?.name === 'Общий денежный поток')
    const ending = findRow(rows, (row) => row?.id === 'ending-balance' || row?.name === 'Остатки на конец периода')
    return {
      receipts: sum(receiptRows),
      payments: sum(paymentRows),
      net: net ? valueOf(net, activeKey, keys) : 0,
      ending: ending ? valueOf(ending, activeKey, keys) : 0,
    }
  }, [rows, receiptRows, paymentRows, activeKey, keys])

  const groupingOptions = useMemo(
    () => [
      { value: 'daily', label: t('cashflow.grouping.daily') },
      { value: 'monthly', label: t('cashflow.grouping.monthly') },
      { value: 'quarterly', label: t('cashflow.grouping.quarterly') },
      { value: 'yearly', label: t('cashflow.grouping.yearly') },
    ],
    [t]
  )

  const activeTitle =
    activeKey === TOTAL_KEY ? t('common.total') : legend.find((item) => item.key === activeKey)?.title || ''

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader title={t('cashflow.title')} onBack={() => router.push('/m/reports')} />

      {/* Период отчёта */}
      <button
        type="button"
        onClick={() => setPeriodOpen(true)}
        className="flex w-full items-center gap-2 rounded-2xl bg-white px-4 py-3 text-left active:bg-slate-50"
      >
        <CalendarDays size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-slate-900">
          {[periodStartDate, periodEndDate]
            .filter(Boolean)
            .map((date) => moment(date).format('DD.MM.YYYY'))
            .join(' — ')}
        </span>
        <span className="shrink-0 text-[13px] font-semibold text-[#0e73f6]">
          {groupingOptions.find((option) => option.value === periodType)?.label}
        </span>
      </button>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
        </div>
      )}

      {!isLoading && rows.length === 0 && <MEmpty icon={TrendingUp} title={tm('reports.noData')} />}

      {!isLoading && rows.length > 0 && (
        <>
          {/* Столбики по периодам — они же выбор периода */}
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

          {/* Итоги выбранного периода */}
          <div className="px-1 pt-5 pb-2.5 text-[15px] font-bold text-slate-900">{activeTitle}</div>
          <div className="grid grid-cols-2 gap-2.5">
            <ReportTile label={tm('reports.receipts')} value={summary.receipts} currency={currencyCode} tone="in" />
            <ReportTile label={tm('reports.payments')} value={summary.payments} currency={currencyCode} tone="out" />
            <ReportTile
              label={tm('reports.netFlow')}
              value={summary.net}
              currency={currencyCode}
              tone={summary.net >= 0 ? 'in' : 'out'}
            />
            <ReportTile label={tm('reports.endingBalance')} value={summary.ending} currency={currencyCode} />
          </div>

          {/* Статьи этого периода */}
          <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{t('cashflow.articleHeader')}</div>
          <MCard list>
            {rows.map((row) => (
              <TreeRow key={row.id || row.name} row={row} periodKey={activeKey} keys={keys} currency={currencyCode} />
            ))}
          </MCard>

          <p className="px-2 pt-3 text-[11px] leading-relaxed text-slate-400">{tm('reports.tableHint')}</p>
        </>
      )}

      <ReportPeriodSheet
        open={periodOpen}
        onClose={() => setPeriodOpen(false)}
        start={periodStartDate}
        end={periodEndDate}
        grouping={periodType}
        groupingOptions={groupingOptions}
        onApply={({ start, end, grouping }) => {
          cashFlowStore.setPeriodDateRange({ start, end })
          cashFlowStore.setPeriodType(grouping)
          setPeriodKey(null)
        }}
      />
    </div>
  )
})

export default MobileCashflowPage

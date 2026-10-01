'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { MMultiSelectField } from '@/components/mobile/fields'
import PeriodBars from '@/components/mobile/PeriodBars'
import ReportPeriodSheet from '@/components/mobile/ReportPeriodSheet'
import { findRow, ReportTile, TOTAL_KEY, TreeRow, valueOf } from '@/components/mobile/ReportTree'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useRouter } from '@/hooks/useAppRouter'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { paymentCalendarStore } from '@/modules/plans/PaymentCalendar/store'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, CalendarDays, Loader2, SlidersHorizontal } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Платёжный календарь на телефоне.
 *
 * На компьютере — таблица доходов и расходов по дням, неделям или месяцам.
 * Здесь как в отчётах: период и шаг сверху, столбики по периодам, итоги
 * выбранного периода и статьи деревом. Запрос и хранилище фильтров те же,
 * что у календаря на компьютере, поэтому цифры совпадают.
 */
const MobilePaymentCalendarPage = observer(() => {
  const t = useTranslations('Reports')
  const tm = useTranslations('Mobile')
  const tf = useTranslations('filters')
  const tc = useTranslations('Common')
  const tNav = useTranslations('Sidebar')
  const router = useRouter()
  const [periodKey, setPeriodKey] = useState(null)
  const [periodOpen, setPeriodOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const {
    dateRange,
    selectedGrouping,
    isCalculation,
    selectedAccounts,
    selectedCounterparties,
    selectedLegalEntities,
    deals,
    ebitda,
    ebit,
    ebt,
  } = paymentCalendarStore

  // Те же поля, что шлёт календарь на компьютере
  const filterData = {
    periodStartDate: moment(dateRange?.start).format('YYYY-MM-DD'),
    periodEndDate: moment(dateRange?.end).format('YYYY-MM-DD'),
    periodType: selectedGrouping,
    userCurrencyCode: GlobalCurrency?.code,
    accounting_method: isCalculation,
    my_accounts_ids: selectedAccounts,
    counterparties_ids: selectedCounterparties,
    legal_entity_ids: selectedLegalEntities,
    isEbitda: ebitda,
    isEbit: ebit,
    isEbt: ebt,
    limit: 100,
    page: 1,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['payment_calendar_profit_and_loss', filterData],
    queryFn: () => apiClient.invokeFunction({ method: 'profit_and_loss', data: filterData }),
    select: (response) => response?.data?.data,
    refetchOnWindowFocus: false,
  })

  // Списки для фильтров
  const { data: accounts = [], isLoading: loadingAccounts } = useUcodeRequestQuery({
    method: 'get_my_accounts',
    data: { page: 1, limit: 100, active: true },
    skip: !filtersOpen,
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })
  const { data: counterparties = [], isLoading: loadingCounterparties } = useUcodeRequestQuery({
    method: 'get_counterparties',
    data: { page: 1, limit: 200 },
    skip: !filtersOpen,
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })
  const { data: dealsList = [], isLoading: loadingDeals } = useUcodeRequestQuery({
    method: 'get_sales_list_simple',
    data: { page: 1, limit: 100 },
    skip: !filtersOpen,
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })

  const currency = GlobalCurrency?.name || ''
  const legend = useMemo(() => data?.legend || [], [data])
  const keys = useMemo(() => legend.map((item) => item.key), [legend])
  const rows = useMemo(() => data?.rows || [], [data])
  const activeKey = periodKey || keys[keys.length - 1] || TOTAL_KEY

  const isIncome = (row) => row?.id === 'income' || row?.name === 'income' || row?.type === 'income'
  const isExpense = (row) => row?.id === 'expenses' || row?.name === 'expenses' || row?.type === 'expenses'
  const incomeRow = useMemo(() => findRow(rows, isIncome), [rows])
  const expenseRow = useMemo(() => findRow(rows, isExpense), [rows])

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

  const activeTitle = activeKey === TOTAL_KEY ? t('common.total') : legend.find((item) => item.key === activeKey)?.title || ''

  const summary = useMemo(() => {
    const resultRows = rows.filter((row) => row?.type === 'result' || row?.type === 'total')
    const profitRow = resultRows[resultRows.length - 1]
    const revenue = incomeRow ? valueOf(incomeRow, activeKey, keys) : 0
    const cost = expenseRow ? valueOf(expenseRow, activeKey, keys) : 0
    const profit = profitRow ? valueOf(profitRow, activeKey, keys) : revenue - cost
    return { revenue, cost, profit, margin: revenue ? (profit / revenue) * 100 : null }
  }, [rows, incomeRow, expenseRow, activeKey, keys])

  const activeFilters =
    (selectedAccounts?.length ? 1 : 0) + (selectedCounterparties?.length ? 1 : 0) + (deals?.length ? 1 : 0)

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader
        title={t('paymentCalendar.title')}
        onBack={() => router.push('/m/plans')}
        action={
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-label={tf('openFilters')}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-full',
              activeFilters ? 'bg-[#0e73f6] text-white' : 'bg-white text-slate-600'
            )}
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
            {activeFilters > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#f4f5f7] bg-red-500 px-1 text-[10px] font-bold text-white">
                {activeFilters}
              </span>
            )}
          </button>
        }
      />

      {/* Период и шаг */}
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

      {/* Метод учёта и «на сегодня» */}
      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 rounded-2xl bg-white p-1">
          {['cash', 'accrual'].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => paymentCalendarStore.setIsCalculation(value)}
              className={cn(
                'min-w-0 flex-1 truncate rounded-xl py-2 text-[12px] font-semibold',
                isCalculation === value ? 'bg-slate-900 text-white' : 'text-slate-500'
              )}
            >
              {t(`pnl.accounting.${value}`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            paymentCalendarStore.resetToToday()
            setPeriodKey(null)
          }}
          className="h-10 shrink-0 rounded-2xl bg-white px-3.5 text-[12px] font-semibold text-slate-600 active:bg-slate-50"
        >
          {tc('forToday')}
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
        </div>
      )}

      {!isLoading && rows.length === 0 && <MEmpty icon={BarChart3} title={t('pnl.emptyPeriod')} subtitle={t('pnl.emptyHint')} />}

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
            <ReportTile label={tm('home.income')} value={summary.revenue} currency={currency} tone="in" />
            <ReportTile label={tm('home.expense')} value={summary.cost} currency={currency} tone="out" />
            <ReportTile label={tm('home.profit')} value={summary.profit} currency={currency} tone={summary.profit >= 0 ? 'in' : 'out'} />
            <ReportTile label={tm('reports.margin')} value={summary.margin} percent tone={summary.margin >= 0 ? 'in' : 'out'} />
          </div>

          <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{t('pnl.article')}</div>
          <MCard list>
            {rows.map((row) => (
              <TreeRow key={row.id || row.name} row={row} periodKey={activeKey} keys={keys} currency={currency} />
            ))}
          </MCard>
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
          paymentCalendarStore.setDateRange({ start, end })
          paymentCalendarStore.setSelectedGrouping(grouping)
          setPeriodKey(null)
        }}
      />

      {/* Фильтры — те же, что в боковой панели календаря на компьютере */}
      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={tf('openFilters')}
        footer={
          <button
            type="button"
            onClick={() => {
              paymentCalendarStore.setSelectedAccounts([])
              paymentCalendarStore.setSelectedLegalEntities([])
              paymentCalendarStore.setSelectedCounterparties([])
              paymentCalendarStore.setDeals([])
            }}
            className="h-12 w-full rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700"
          >
            {tf('reset')}
          </button>
        }
      >
        <div className="flex flex-col gap-2 [&>button]:bg-slate-50">
          <MMultiSelectField
            label={tNav('directories.accounts')}
            value={selectedAccounts || []}
            options={accounts.map((item) => ({ value: item.guid, label: item.nazvanie, sub: item.legal_entity_name }))}
            loading={loadingAccounts}
            onChange={(value) => paymentCalendarStore.setSelectedAccounts(value)}
          />
          <MMultiSelectField
            label={tf('counterparties')}
            value={selectedCounterparties || []}
            options={counterparties.map((item) => ({ value: item.guid, label: item.nazvanie || item.name }))}
            loading={loadingCounterparties}
            onChange={(value) => paymentCalendarStore.setSelectedCounterparties(value)}
          />
          <MMultiSelectField
            label={t('common.deals')}
            value={deals || []}
            options={dealsList.map((item) => ({ value: item.guid, label: item.name || item.nazvanie }))}
            loading={loadingDeals}
            onChange={(value) => paymentCalendarStore.setDeals(value)}
          />
        </div>
      </BottomSheet>
    </div>
  )
})

export default MobilePaymentCalendarPage

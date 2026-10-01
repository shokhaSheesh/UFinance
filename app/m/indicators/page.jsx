'use client'

import { readDebtsResponse, sortDebts } from '@/components/Indicators/Debts/utils'
import { findByName } from '@/components/Indicators/Income'
import {
  CASH_FLOW_STREAMS,
  findRow,
  useIndicatorBalances,
  useIndicatorCashFlow,
  useIndicatorProfit,
} from '@/components/Indicators/shared/indicatorQueries'
import { CHART_COLORS } from '@/components/Indicators/shared/chartTheme'
import { localizeMonthTitle } from '@/components/Indicators/utils/localizeMonth'
import { enqueueIndicatorRequest } from '@/components/Indicators/utils/requestQueue'
import AnalyticsFilters from '@/components/mobile/analytics/AnalyticsFilters'
import { BarsChart } from '@/components/mobile/analytics/charts'
import { MCard, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useRouter } from '@/hooks/useAppRouter'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { indicators } from '@/store/indicatos.store'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from '@/components/mobile/icons'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * «Показатели» на телефоне.
 *
 * Те же блоки, что на странице на компьютере, — прибыль, рентабельность,
 * денежный поток, остатки, структура платежей, доходные клиенты, сделки по
 * статусам и долги, — на тех же запросах и фильтрах (ключи запросов
 * совпадают, ответы берутся из общего кэша). Сверху прилипает строка
 * разделов: касание прокручивает к блоку, текущий подсвечен. Каждый блок —
 * карточка: итоги строками, невысокий график, списки вместо легенд.
 */

const num = (value) => Number(value) || 0
const pct = (value) => (value == null ? '—' : `${Math.round(value * 10) / 10}%`)

// ── Оформление блоков ────────────────────────────────────────────────────────

/** Блок показателя: заголовок, справа — переключатель, ниже содержимое. */
const Section = ({ id, title, action, loading, children }) => (
  <section id={id} data-indicator-section className="scroll-mt-[72px]">
    <MCard className="relative">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="min-w-0 text-[16px] font-bold text-slate-900">{title}</h2>
        {loading && <Loader2 size={16} className="mt-1 shrink-0 animate-spin text-slate-300" aria-hidden="true" />}
      </div>
      {action && <div className="mb-3">{action}</div>}
      {children}
    </MCard>
  </section>
)

/** Переключатель внутри блока: метод учёта, вкладка потока, вид долга. */
const Toggle = ({ value, options, onChange }) => (
  <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={cn(
          'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap',
          value === option.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
)

/** Итоги блока: подпись слева, сумма справа, точка цвета серии. */
const Totals = ({ rows }) => (
  <div className="mb-3 flex flex-col">
    {rows.map((row) => (
      <div key={row.label} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
        <span className="flex min-w-0 items-center gap-2 text-[13px] text-slate-600">
          {row.color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: row.color }} />}
          <span className="truncate">{row.label}</span>
        </span>
        <span className={cn('shrink-0 text-[14px] font-bold tabular-nums text-slate-900', row.className)}>{row.value}</span>
      </div>
    ))}
  </div>
)

/** Список с полосой доли: статьи, клиенты, должники, статусы. */
const ShareList = ({ items, color = '#3b82f6', currency, empty, renderSub }) => {
  const max = Math.max(...items.map((item) => Math.abs(num(item.value))), 1)
  if (!items.length) return <p className="py-6 text-center text-[13px] text-slate-400">{empty}</p>
  return (
    <ol className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={item.key ?? `${item.name}-${index}`}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-[13px] text-slate-700">{item.name}</span>
            <span className="shrink-0 text-[13px] font-semibold tabular-nums text-slate-900">
              <Money value={item.value} currency={currency} />
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${(Math.abs(num(item.value)) / max) * 100}%`, background: item.color || color }}
            />
          </div>
          {renderSub && <div className="mt-1 text-[11px] text-slate-400">{renderSub(item)}</div>}
        </li>
      ))}
    </ol>
  )
}

// ── Страница ─────────────────────────────────────────────────────────────────

const MobileIndicatorsPage = observer(() => {
  const t = useTranslations('Indicators')
  const tNav = useTranslations('Sidebar')
  const router = useRouter()
  const locale = useLocale()
  const mounted = useMounted()
  const searchParams = useSearchParams()
  const scrollRef = useRef(null)
  const currency = mounted ? GlobalCurrency?.name : ''

  const [cashTab, setCashTab] = useState('total')
  const [debtType, setDebtType] = useState('debitorka')
  const [activeSection, setActiveSection] = useState('profit')

  const { rangeMonth, periodType, projects, deals, accounts, currencyCode, debtsLegalEntities } = indicators

  // ── Прибыль и рентабельность: один запрос P&L, как на компьютере ─────────
  const profitQuery = useIndicatorProfit()
  const profit = useMemo(() => {
    const legend = profitQuery.data?.legend || []
    const rows = profitQuery.data?.rows || []
    const keys = legend.map((item) => item.key)
    const read = (row) => keys.map((key) => num(row?.values?.[key]))
    const revenue = read(findRow(rows, 'revenue'))
    const expenses = read(findRow(rows, 'expenses'))
    const net = read(findRow(rows, 'net-profit'))
    const dividendsRow = findRow(rows, 'dividends')
    const revenueTotal = revenue.reduce((a, b) => a + b, 0)
    const expensesTotal = expenses.reduce((a, b) => a + b, 0)
    const netTotal = net.reduce((a, b) => a + b, 0)
    const margins = revenue.map((value, index) => (value > 0 ? Math.round((net[index] / value) * 1000) / 10 : null))
    const withValue = margins.map((value, index) => ({ value, index })).filter((item) => item.value != null)
    return {
      labels: legend.map((item) => localizeMonthTitle(locale, item.startDate)),
      revenue,
      expenses,
      net,
      dividendsTotal: num(dividendsRow?.totalValue),
      revenueTotal,
      expensesTotal,
      netTotal,
      margin: revenueTotal > 0 ? (netTotal / revenueTotal) * 100 : null,
      margins,
      best: withValue.reduce((acc, item) => (acc == null || item.value > acc.value ? item : acc), null),
      worst: withValue.reduce((acc, item) => (acc == null || item.value < acc.value ? item : acc), null),
    }
  }, [profitQuery.data, locale])

  // ── Денежный поток по выбранному потоку ───────────────────────────────────
  const cashQuery = useIndicatorCashFlow()
  const cashFlow = useMemo(() => {
    const legend = cashQuery.data?.legend || []
    const rows = cashQuery.data?.rows || []
    const keys = legend.map((item) => item.key)
    const streamNames = {
      total: CASH_FLOW_STREAMS,
      operational: ['Операционный поток'],
      investment: ['Инвестиционный поток'],
      financial: ['Финансовый поток'],
    }[cashTab]
    const streams = rows.filter((row) => streamNames.includes(row.name))
    const parts = (name) => streams.flatMap((stream) => stream.details?.filter((detail) => detail.name === name) || [])
    const receipts = parts('Поступления')
    const payments = parts('Выплаты')
    const receiptsData = keys.map((key) => receipts.reduce((sum, row) => sum + num(row.values?.[key]), 0))
    const paymentsData = keys.map((key) => payments.reduce((sum, row) => sum + Math.abs(num(row.values?.[key])), 0))
    const receiptsTotal = receipts.reduce((sum, row) => sum + num(row.totalValue), 0)
    const paymentsTotal = payments.reduce((sum, row) => sum + Math.abs(num(row.totalValue)), 0)
    return {
      labels: legend.map((item) => localizeMonthTitle(locale, item.startDate)),
      receiptsData,
      paymentsData,
      differenceData: receiptsData.map((value, index) => value - paymentsData[index]),
      receiptsTotal,
      paymentsTotal,
    }
  }, [cashQuery.data, cashTab, locale])

  // ── Остатки на счетах ────────────────────────────────────────────────────
  const balancesQuery = useIndicatorBalances()
  const balances = useMemo(() => {
    const list = balancesQuery.data || []
    if (!list.length) return { total: null, accounts: [], labels: [], series: [] }
    const days = list[0].totalValuesByDays || []
    const today = moment().startOf('day')
    let index = days.findIndex((day) => moment(day.date).isSame(today, 'day'))
    if (index === -1) index = days.reduce((last, day, i) => (moment(day.date).isSameOrBefore(today, 'day') ? i : last), days.length - 1)
    const totals = days.map((_, i) => list.reduce((sum, account) => sum + num(account.totalValuesByDays?.[i]?.totalInUserCurrency), 0))
    // на телефоне хватает одной точки в неделю — линия та же, график легче
    const step = Math.max(1, Math.ceil(days.length / 60))
    const picked = days.map((day, i) => ({ day, i })).filter(({ i }) => i % step === 0 || i === days.length - 1)
    return {
      total: totals[index] ?? null,
      accounts: list
        .map((account) => ({
          key: account.account?.guid || account.account?.title,
          name: account.account?.title,
          value: num(account.totalValuesByDays?.[index]?.totalInUserCurrency),
        }))
        .sort((a, b) => b.value - a.value),
      labels: picked.map(({ day }) => moment(day.date).format('DD.MM')),
      series: picked.map(({ i }) => Math.round(totals[i])),
    }
  }, [balancesQuery.data])

  // ── Структура платежей ───────────────────────────────────────────────────
  const structureFilter = {
    periodStartDate: moment(rangeMonth.start).format('YYYY-MM-DD'),
    periodEndDate: moment(rangeMonth.end).format('YYYY-MM-DD'),
    periodType,
    userCurrencyCode: GlobalCurrency?.code,
    accounting_method: indicators.accounting,
    currencyCode,
    sellingDealId: deals,
    accountId: accounts,
    project_ids: projects,
    isEbitda: false,
    isEbit: false,
    isEbt: false,
    limit: 100,
    page: 1,
  }
  const structurePnl = useQuery({
    queryKey: ['profit_and_loss_income', structureFilter],
    queryFn: () => enqueueIndicatorRequest(() => apiClient.invokeFunction({ method: 'profit_and_loss', data: structureFilter })),
    select: (response) => response?.data?.data,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
  const structure = useMemo(() => {
    const byIncome = indicators.paymentStructureMethod === 'income_expenses'
    const total = (item) => num(item?.total ?? item?.totalValue)
    if (byIncome) {
      const rows = structurePnl.data?.rows || []
      const income = rows.find((row) => row?.name === 'Доходы')?.details || []
      const expenses = rows.find((row) => row?.name === 'Расходы')?.details || []
      return {
        income: income.filter((item) => total(item) !== 0).map((item) => ({ name: item.name, value: total(item) })),
        expenses: expenses.filter((item) => total(item) !== 0).map((item) => ({ name: item.name, value: Math.abs(total(item)) })),
      }
    }
    const streams = (cashQuery.data?.rows || []).filter((row) => CASH_FLOW_STREAMS.includes(row?.name))
    return {
      income: findByName(streams, 'Поступления')
        .filter((item) => num(item?.totalValue) !== 0)
        .map((item) => ({ name: item.name, value: num(item.totalValue) })),
      expenses: findByName(streams, 'Выплаты')
        .filter((item) => num(item?.totalValue) !== 0)
        .map((item) => ({ name: item.name, value: Math.abs(num(item.totalValue)) })),
    }
    // paymentStructureMethod — наблюдаемое поле хранилища
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structurePnl.data, cashQuery.data, indicators.paymentStructureMethod])

  // ── Самые доходные клиенты ───────────────────────────────────────────────
  const clientsFilter = {
    period_from: rangeMonth?.start,
    period_to: rangeMonth?.end,
    period_type: periodType,
    accounting_method: indicators.profitableclientsMethod,
    sellingDealId: deals,
    project_ids: projects,
    accountId: accounts,
    currencyCode,
  }
  const clientsQuery = useQuery({
    queryKey: ['profitable_clients', clientsFilter],
    queryFn: () => enqueueIndicatorRequest(() => apiClient.invokeFunction({ method: 'report_counterparties_financials', data: clientsFilter })),
    select: (response) => response?.data?.data,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
  const clients = useMemo(() => {
    const top = (clientsQuery.data?.counterparties80 || []).map((client, index) => ({
      key: client.guid || `${client.name}-${index}`,
      name: client.name,
      value: num(client.summa),
      share: client.percent,
      cumulative: client.percent_sum,
    }))
    const rest = clientsQuery.data?.counterparties20
    return {
      top,
      rest: rest ? { name: t('profitableClients.legendShort.clients20'), value: num(rest.summa), share: rest.percent } : null,
    }
  }, [clientsQuery.data, t])

  // ── Сделки по статусам ───────────────────────────────────────────────────
  const dealsFilter = {
    limit: 500,
    page: 1,
    from_date: rangeMonth?.start ? moment(rangeMonth.start).format('YYYY-MM-DD') : null,
    to_date: rangeMonth?.end ? moment(rangeMonth.end).format('YYYY-MM-DD') : null,
    project_ids: projects?.length ? projects : null,
    accounting_method: 'Метод начисления',
    isCalculation: false,
  }
  const dealsQuery = useQuery({
    queryKey: ['indicators_deals_by_status', dealsFilter],
    queryFn: () => enqueueIndicatorRequest(() => apiClient.invokeFunction({ method: 'get_sales_list_simple', data: dealsFilter })),
    select: (response) => ({ items: response?.data?.data || [], summary: response?.data?.summary }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
  const dealGroups = useMemo(() => {
    const map = new Map()
    ;(dealsQuery.data?.items || []).forEach((deal) => {
      const name = deal?.Status?.[0] || t('dealsByStatus.noStatus')
      const sum = num(deal?.total_products_summa)
      const paid = Math.min((sum * num(deal?.receipts_percentage)) / 100, sum)
      const group = map.get(name) || { key: name, name, color: deal?.color || '#64748b', count: 0, value: 0, paid: 0 }
      group.count += 1
      group.value += sum
      group.paid += paid
      map.set(name, group)
    })
    const list = [...map.values()].sort((a, b) => b.value - a.value)
    const sum = list.reduce((acc, group) => acc + group.value, 0)
    const paid = list.reduce((acc, group) => acc + group.paid, 0)
    const count = dealsQuery.data?.summary?.count ?? list.reduce((acc, group) => acc + group.count, 0)
    return { list, sum, paid, count }
  }, [dealsQuery.data, t])

  // ── Долги: тот же запрос, что в блоке «Долги» ────────────────────────────
  const debtFilter = {
    expired: false,
    period_from: rangeMonth?.start ? moment(rangeMonth.start).format('YYYY-MM-DD') : null,
    period_to: rangeMonth?.end ? moment(rangeMonth.end).format('YYYY-MM-DD') : null,
    period_type: periodType,
    legal_entity_ids: debtsLegalEntities,
    project_ids: projects,
    sellingDealId: deals,
    currencyCode,
  }
  const debtMethod = debtType === 'debitorka' ? 'get_counterparties_debitorka' : 'get_counterparties_kreditorka'
  const debtQuery = useQuery({
    queryKey: [debtMethod, debtFilter],
    queryFn: () => enqueueIndicatorRequest(() => apiClient.invokeFunction({ method: debtMethod, data: debtFilter })),
    select: (response) => readDebtsResponse(response, t('debts.noName')),
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
  const debts = useMemo(
    () => sortDebts(debtQuery.data?.items || [], 'total').slice(0, 10).map((item) => ({ ...item, key: item.guid, value: item.total })),
    [debtQuery.data]
  )

  // ── Разделы: строка сверху и прокрутка к блоку ───────────────────────────
  const sections = [
    { id: 'profit', label: t('profit.title') },
    { id: 'margin', label: t('margin.title') },
    { id: 'cash-flow', label: t('cashFlow.title') },
    { id: 'account-balance', label: t('accountBalance.title') },
    { id: 'payment-structure', label: t('paymentStructure.title') },
    { id: 'profitable-clients', label: t('profitableClients.title') },
    { id: 'deals-by-status', label: t('dealsByStatus.title') },
    { id: 'debts', label: t('debts.title') },
  ]

  const jumpTo = (id, smooth = true) => {
    const root = scrollRef.current
    const target = root?.querySelector(`#${id}`)
    if (!root || !target) return
    const top = target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 64
    root.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
    setActiveSection(id)
  }

  // С карточки на «Отчётах» можно прийти сразу к нужному блоку: ?section=debts
  const initialSection = searchParams.get('section')
  useEffect(() => {
    if (!initialSection) return
    const timer = setTimeout(() => jumpTo(initialSection, false), 300)
    return () => clearTimeout(timer)
    // только при открытии экрана
  }, [initialSection])

  // Подсвечиваем раздел, который сейчас наверху экрана
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveSection(visible[0].target.id)
      },
      { root, rootMargin: '-20% 0px -70% 0px' }
    )
    root.querySelectorAll('[data-indicator-section]').forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  const chipsRef = useRef(null)
  useEffect(() => {
    chipsRef.current?.querySelector(`[data-chip="${activeSection}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeSection])

  const methodOptions = [
    { value: 'accrual', label: t('profit.accrualMethod') },
    { value: 'cash', label: t('profit.cashMethod') },
  ]

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader title={tNav('nav.indicators')} onBack={() => router.push('/m/reports')} />

      <AnalyticsFilters />

      {/* Разделы — прилипают к верху при прокрутке */}
      <div className="sticky top-0 z-20 -mx-4 mt-2.5 bg-[#f4f5f7] px-4 py-2">
        <div ref={chipsRef} className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              data-chip={section.id}
              onClick={() => jumpTo(section.id)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-2 text-[12px] font-semibold whitespace-nowrap',
                activeSection === section.id ? 'bg-[#0e73f6] text-white' : 'bg-white text-slate-600'
              )}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-1 flex flex-col gap-2.5">
        {/* Прибыль */}
        <Section
          id="profit"
          title={t('profit.title')}
          loading={profitQuery.isFetching}
          action={
            <Toggle
              value={indicators.profitableclientsMethod}
              options={methodOptions}
              onChange={(value) => indicators.setState('profitableclientsMethod', value)}
            />
          }
        >
          <Totals
            rows={[
              { label: t('profit.stats.income'), color: CHART_COLORS.income, value: <Money value={profit.revenueTotal} currency={currency} /> },
              { label: t('profit.stats.expenses'), color: CHART_COLORS.expense, value: <Money value={profit.expensesTotal} currency={currency} /> },
              {
                label: t('profit.stats.netProfit'),
                color: CHART_COLORS.result,
                value: <Money value={profit.netTotal} currency={currency} />,
                className: profit.netTotal < 0 ? 'text-red-600' : 'text-emerald-600',
              },
              { label: t('profit.stats.profitability'), value: pct(profit.margin) },
              ...(profit.dividendsTotal
                ? [{ label: t('profit.stats.dividends'), color: CHART_COLORS.dividends, value: <Money value={profit.dividendsTotal} currency={currency} /> }]
                : []),
            ]}
          />
          {mounted && (
            <BarsChart
              labels={profit.labels}
              bars={[
                { name: t('profit.series.income'), data: profit.revenue, color: CHART_COLORS.income },
                { name: t('profit.series.expenses'), data: profit.expenses, color: CHART_COLORS.expense },
              ]}
              lines={[{ name: t('profit.series.netProfit'), data: profit.net, color: CHART_COLORS.result, dashed: true }]}
            />
          )}
        </Section>

        {/* Рентабельность по периодам */}
        <Section id="margin" title={t('margin.title')} loading={profitQuery.isFetching}>
          <Totals
            rows={[
              { label: t('margin.average'), value: pct(profit.margin) },
              {
                label: t('margin.best'),
                value: profit.best ? `${profit.labels[profit.best.index]} · ${pct(profit.best.value)}` : '—',
                className: 'text-emerald-600',
              },
              {
                label: t('margin.worst'),
                value: profit.worst ? `${profit.labels[profit.worst.index]} · ${pct(profit.worst.value)}` : '—',
                className: profit.worst?.value < 0 ? 'text-red-600' : undefined,
              },
            ]}
          />
          {mounted && profit.margins.some((value) => value != null) ? (
            <BarsChart
              labels={profit.labels}
              lines={[{ name: t('margin.series'), data: profit.margins, color: CHART_COLORS.result, area: 'rgba(16,185,129,0.08)' }]}
              percent
              height={190}
            />
          ) : (
            <p className="py-6 text-center text-[13px] text-slate-400">{t('margin.noData')}</p>
          )}
        </Section>

        {/* Денежный поток */}
        <Section
          id="cash-flow"
          title={t('cashFlow.title')}
          loading={cashQuery.isFetching}
          action={
            <Toggle
              value={cashTab}
              options={['total', 'operational', 'investment', 'financial'].map((value) => ({ value, label: t(`cashFlow.tabs.${value}`) }))}
              onChange={setCashTab}
            />
          }
        >
          <Totals
            rows={[
              { label: t('cashFlow.series.receipts'), color: CHART_COLORS.income, value: <Money value={cashFlow.receiptsTotal} currency={currency} /> },
              { label: t('cashFlow.series.payments'), color: CHART_COLORS.expense, value: <Money value={cashFlow.paymentsTotal} currency={currency} /> },
              {
                label: t('cashFlow.series.difference'),
                color: CHART_COLORS.result,
                value: <Money value={cashFlow.receiptsTotal - cashFlow.paymentsTotal} currency={currency} />,
                className: cashFlow.receiptsTotal - cashFlow.paymentsTotal < 0 ? 'text-red-600' : 'text-emerald-600',
              },
            ]}
          />
          {mounted && (
            <BarsChart
              labels={cashFlow.labels}
              bars={[
                { name: t('cashFlow.series.receipts'), data: cashFlow.receiptsData, color: CHART_COLORS.income },
                { name: t('cashFlow.series.payments'), data: cashFlow.paymentsData, color: CHART_COLORS.expense },
              ]}
              lines={[{ name: t('cashFlow.series.difference'), data: cashFlow.differenceData, color: CHART_COLORS.result }]}
            />
          )}
        </Section>

        {/* Остатки на счетах */}
        <Section id="account-balance" title={t('accountBalance.title')} loading={balancesQuery.isFetching}>
          <Totals
            rows={[
              {
                label: `${t('accountBalance.totalBalance')} · ${t('accountBalance.today').toLowerCase()}`,
                color: CHART_COLORS.balance,
                value: <Money value={balances.total ?? 0} currency={currency} />,
              },
            ]}
          />
          {mounted && balances.series.length > 1 && (
            <BarsChart
              labels={balances.labels}
              lines={[{ name: t('accountBalance.totalBalance'), data: balances.series, color: CHART_COLORS.balance, area: 'rgba(14,115,246,0.08)' }]}
              height={180}
            />
          )}
          <div className="mt-3">
            <ShareList items={balances.accounts} color={CHART_COLORS.balance} currency={currency} empty={t('debts.empty')} />
          </div>
        </Section>

        {/* Структура платежей */}
        <Section
          id="payment-structure"
          title={t('paymentStructure.title')}
          loading={structurePnl.isFetching}
          action={
            <Toggle
              value={indicators.paymentStructureMethod}
              options={[
                { value: 'income_expenses', label: t('paymentStructure.incomeExpenses') },
                { value: 'receipts_payments', label: t('paymentStructure.receiptsPayments') },
              ]}
              onChange={(value) => indicators.setState('paymentStructureMethod', value)}
            />
          }
        >
          {[
            {
              key: 'income',
              title: indicators.paymentStructureMethod === 'income_expenses' ? t('profit.series.income') : t('cashFlow.series.receipts'),
              items: structure.income,
              color: CHART_COLORS.income,
            },
            {
              key: 'expenses',
              title: indicators.paymentStructureMethod === 'income_expenses' ? t('profit.series.expenses') : t('cashFlow.series.payments'),
              items: structure.expenses,
              color: CHART_COLORS.expense,
            },
          ].map((group) => {
            const sum = group.items.reduce((acc, item) => acc + Math.abs(item.value), 0) || 1
            return (
              <div key={group.key} className="mb-4 last:mb-0">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-semibold text-slate-800">{group.title}</span>
                  <span className="text-[13px] font-bold text-slate-900">
                    <Money value={group.items.reduce((acc, item) => acc + item.value, 0)} currency={currency} />
                  </span>
                </div>
                <ShareList
                  items={[...group.items].sort((a, b) => b.value - a.value)}
                  color={group.color}
                  currency=""
                  empty={t('debts.empty')}
                  renderSub={(item) => pct((Math.abs(item.value) / sum) * 100)}
                />
              </div>
            )
          })}
        </Section>

        {/* Самые доходные клиенты */}
        <Section
          id="profitable-clients"
          title={t('profitableClients.title')}
          loading={clientsQuery.isFetching}
          action={
            <Toggle
              value={indicators.profitableclientsMethod}
              options={methodOptions}
              onChange={(value) => indicators.setState('profitableclientsMethod', value)}
            />
          }
        >
          <p className="mb-3 text-[12px] text-slate-500">{t('profitableClients.legendShort.clients80')}</p>
          <ShareList
            items={[...clients.top, ...(clients.rest ? [{ ...clients.rest, key: 'rest', color: CHART_COLORS.secondary }] : [])]}
            color={CHART_COLORS.income}
            currency={currency}
            empty={t('debts.empty')}
            renderSub={(item) =>
              item.cumulative != null
                ? `${pct(item.share)} · ${t('profitableClients.legendShort.incomeShare')} ${pct(item.cumulative)}`
                : pct(item.share)
            }
          />
        </Section>

        {/* Сделки по статусам */}
        <Section id="deals-by-status" title={t('dealsByStatus.title')} loading={dealsQuery.isFetching}>
          <Totals
            rows={[
              { label: t('dealsByStatus.count'), value: String(dealGroups.count || 0) },
              { label: t('dealsByStatus.sum'), value: <Money value={dealGroups.sum} currency={currency} /> },
              {
                label: t('dealsByStatus.average'),
                value: <Money value={dealGroups.list.length ? dealGroups.sum / Math.max(1, dealGroups.list.reduce((a, g) => a + g.count, 0)) : 0} currency={currency} />,
              },
              {
                label: t('dealsByStatus.paid'),
                value: (
                  <>
                    <Money value={dealGroups.paid} currency={currency} />
                    <span className="ml-1 text-[11px] font-semibold text-slate-400">
                      {dealGroups.sum ? Math.round((dealGroups.paid / dealGroups.sum) * 100) : 0}%
                    </span>
                  </>
                ),
                className: 'text-emerald-600',
              },
            ]}
          />
          <ShareList
            items={dealGroups.list}
            currency={currency}
            empty={t('dealsByStatus.noData')}
            renderSub={(group) =>
              `${t('dealsByStatus.dealsCount', { count: group.count })} · ${t('dealsByStatus.paidPart')} ${group.value ? Math.round((group.paid / group.value) * 100) : 0}%`
            }
          />
        </Section>

        {/* Долги */}
        <Section
          id="debts"
          title={t('debts.title')}
          loading={debtQuery.isFetching}
          action={
            <Toggle
              value={debtType}
              options={[
                { value: 'debitorka', label: t('debts.debitorka.title') },
                { value: 'kreditorka', label: t('debts.kreditorka.title') },
              ]}
              onChange={setDebtType}
            />
          }
        >
          <Totals
            rows={[
              {
                label: debtType === 'debitorka' ? t('debts.debitorka.total') : t('debts.kreditorka.total'),
                value: <Money value={debtQuery.data?.total ?? 0} currency={currency} />,
              },
              {
                label: t('debts.expired'),
                value: <Money value={debtQuery.data?.expired ?? 0} currency={currency} />,
                className: debtQuery.data?.expired ? 'text-red-600' : undefined,
              },
            ]}
          />
          <ShareList
            items={debts}
            color={debtType === 'debitorka' ? '#3b82f6' : '#f59e0b'}
            currency={currency}
            empty={t('debts.empty')}
            renderSub={(item) => (item.expired ? `${t('debts.expired')}: ${Math.round(item.expired).toLocaleString('ru-RU')}` : null)}
          />
        </Section>
      </div>
    </div>
  )
})

export default MobileIndicatorsPage

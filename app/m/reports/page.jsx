'use client'

import { MScreenHeader } from '@/components/mobile/ui'
import { balanceStore } from '@/components/reports/balance/balance.store'
import { cashFlowStore } from '@/components/reports/cashflow/cashflow.store'
import { pnlStore } from '@/components/reports/profit-and-loss/pnl.store'
import Money from '@/components/shared/Money'
import { useRouter } from '@/hooks/useAppRouter'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { readBalancePeriod } from '@/utils/balanceInsights'
import { buildPeriodPayload } from '@/utils/balancePeriods'
import { useQuery } from '@tanstack/react-query'
import { findRow as findIndicatorRow, useIndicatorProfit } from '@/components/Indicators/shared/indicatorQueries'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { BarChart3, Building2, ChartLine as LineChart, ChevronRight, Scale, TrendingUp } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

/**
 * Отчёты: три карточки с главной цифрой каждого отчёта, а ниже — раздел
 * «Аналитика» с дашбордом «Моя компания».
 *
 * Список из трёх названий ничего не сообщает о делах компании, поэтому на
 * карточке сразу стоит ответ: сколько денег осталось от движения, сколько
 * прибыли, сколько активов. Запросы те же, что на самих отчётах, поэтому
 * переход открывается уже с данными.
 */

const num = (value) => Number(value) || 0

/** Значение узла отчёта по всем периодам. */
const sumRow = (row, keys) => keys.reduce((sum, key) => sum + num(row?.values?.[key]), 0)

/** Поиск узла по имени или id: состав отчётов у компаний отличается. */
const findRow = (rows = [], test) => {
  for (const row of rows) {
    if (test(row)) return row
    const found = findRow(row?.details || [], test)
    if (found) return found
  }
  return null
}

const ReportCard = ({ icon: Icon, title, subtitle, value, currency, tone, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3.5 rounded-[24px] bg-white px-4 py-4 text-left active:bg-slate-50"
  >
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[#0e73f6]">
      <Icon size={19} aria-hidden="true" />
    </span>

    <span className="min-w-0 flex-1">
      <span className="block truncate text-[15px] font-bold text-slate-900">{title}</span>
      <span className="mt-0.5 block truncate text-[12px] text-slate-500">{subtitle}</span>
      {value != null && (
        <span
          className={cn(
            'mt-1.5 block text-[17px] font-bold tabular-nums',
            tone === 'in' ? 'text-emerald-600' : tone === 'out' ? 'text-red-600' : 'text-slate-900'
          )}
        >
          <Money value={value} currency={currency} />
        </span>
      )}
    </span>

    <ChevronRight size={18} className="shrink-0 text-slate-300" aria-hidden="true" />
  </button>
)

const MobileReportsPage = observer(() => {
  const t = useTranslations('Mobile')
  const tr = useTranslations('Reports')
  const tCompany = useTranslations('Company')
  const tNav = useTranslations('Sidebar')
  const router = useRouter()

  // ── Движение денег ────────────────────────────────────────────────────────
  const cashFilter = {
    periodStartDate: cashFlowStore.periodStartDate
      ? moment(cashFlowStore.periodStartDate).format('YYYY-MM-DD')
      : null,
    periodEndDate: cashFlowStore.periodEndDate ? moment(cashFlowStore.periodEndDate).format('YYYY-MM-DD') : null,
    periodType: cashFlowStore.periodType,
    currencyCode: cashFlowStore.currencyCode,
    sellingDealId: cashFlowStore.sellingDealId,
    contrAgentId: cashFlowStore.contrAgentId,
    accountId: cashFlowStore.accountId,
    dealId: cashFlowStore.dealId,
    project_ids: cashFlowStore.projectId,
  }

  const { data: cashData } = useQuery({
    queryKey: ['cash_flow', cashFilter],
    queryFn: () => apiClient.invokeFunction({ method: 'cash_flow', data: cashFilter }),
    select: (response) => response?.data?.data,
    refetchOnWindowFocus: false,
  })

  const cashNet = useMemo(() => {
    const keys = (cashData?.legend || []).map((item) => item.key)
    const row = findRow(
      cashData?.rows || [],
      (item) => item?.id === 'overall-cash-flow' || item?.name === 'Общий денежный поток'
    )
    return row ? sumRow(row, keys) : null
  }, [cashData])

  // ── Прибыли и убытки ──────────────────────────────────────────────────────
  const pnlFilter = {
    periodStartDate: moment(pnlStore.dateRange?.start).format('YYYY-MM-DD'),
    periodEndDate: moment(pnlStore.dateRange?.end).format('YYYY-MM-DD'),
    periodType: pnlStore.selectedGrouping,
    userCurrencyCode: pnlStore.selectedCurrency,
    accounting_method: pnlStore.isCalculation,
    my_accounts_ids: pnlStore.selectedAccounts,
    counterparties_ids: pnlStore.selectedCounterparties,
    legal_entity_ids: pnlStore.selectedLegalEntities,
    project_ids: pnlStore.selectedProjects,
    isEbitda: pnlStore.ebitda,
    isEbit: pnlStore.ebit,
    isEbt: pnlStore.ebt,
    limit: 100,
    page: 1,
  }

  const { data: pnlData } = useQuery({
    queryKey: ['profit_and_loss', pnlFilter],
    queryFn: () => apiClient.invokeFunction({ method: 'profit_and_loss', data: pnlFilter }),
    select: (response) => response?.data?.data,
    refetchOnWindowFocus: false,
  })

  const profit = useMemo(() => {
    const keys = (pnlData?.legend || []).map((item) => item.key)
    const rows = pnlData?.rows || []
    const results = rows.filter((row) => row?.type === 'result' || row?.type === 'total')
    const row = results[results.length - 1]
    return row ? sumRow(row, keys) : null
  }, [pnlData])

  // ── Баланс ────────────────────────────────────────────────────────────────
  const balanceFilter = {
    account_ids: balanceStore.selectedAccount || [],
    legal_entity_id: balanceStore.selectedEntity,
    user_currency_code: balanceStore.selectedCurrency,
    contr_agent_ids: balanceStore.selectedCounterparties,
    ...buildPeriodPayload(balanceStore.dateRange, balanceStore.periodType),
  }

  const { data: balanceData } = useQuery({
    queryKey: ['balance_report', 'multi', balanceFilter],
    queryFn: () => apiClient.invokeFunction({ method: 'balance_report_multi', data: balanceFilter }),
    select: (response) => (response?.data?.periods ? response.data : (response?.data?.data ?? response?.data)),
    refetchOnWindowFocus: false,
  })

  const assets = useMemo(() => {
    const periods = balanceData?.periods || []
    if (!periods.length) return null
    return readBalancePeriod(periods[periods.length - 1]?.data || []).assets
  }, [balanceData])

  // ── Моя компания: чистая прибыль за период «Показателей» ────────────────
  const { data: indicatorProfit } = useIndicatorProfit()
  const companyProfit = useMemo(() => {
    const keys = (indicatorProfit?.legend || []).map((item) => item.key)
    const row = findIndicatorRow(indicatorProfit?.rows || [], 'net-profit')
    return row ? sumRow(row, keys) : null
  }, [indicatorProfit])

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader title={t('tabs.reports')} />

      <div className="flex flex-col gap-2.5">
        <ReportCard
          icon={TrendingUp}
          title={tr('cashflow.title')}
          subtitle={t('reports.netFlow')}
          value={cashNet}
          currency={cashFlowStore.currencyCode}
          tone={cashNet >= 0 ? 'in' : 'out'}
          onClick={() => router.push('/m/reports/cashflow')}
        />
        <ReportCard
          icon={BarChart3}
          title={tr('pnl.title')}
          subtitle={t('home.profit')}
          value={profit}
          currency={pnlStore.selectedCurrency}
          tone={profit >= 0 ? 'in' : 'out'}
          onClick={() => router.push('/m/reports/pnl')}
        />
        <ReportCard
          icon={Scale}
          title={tr('balance.title')}
          subtitle={tr('balance.charts.kpi.assets')}
          value={assets}
          currency={balanceStore.selectedCurrency}
          onClick={() => router.push('/m/reports/balance')}
        />
      </div>

      {/* Аналитика — дашборды поверх отчётов */}
      <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{t('reports.analytics')}</div>
      <div className="flex flex-col gap-2.5">
        <ReportCard
          icon={Building2}
          title={tCompany('pageTitle')}
          subtitle={t('home.profit')}
          value={companyProfit}
          currency={GlobalCurrency?.name}
          tone={companyProfit >= 0 ? 'in' : 'out'}
          onClick={() => router.push('/m/company')}
        />

        <ReportCard
          icon={LineChart}
          title={tNav('nav.indicators')}
          subtitle={t('reports.indicatorsHint')}
          onClick={() => router.push('/m/indicators')}
        />
      </div>
    </div>
  )
})

export default MobileReportsPage

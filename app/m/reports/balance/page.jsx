'use client'

import ReportPeriodSheet from '@/components/mobile/ReportPeriodSheet'
import { ReportTile } from '@/components/mobile/ReportTree'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import { balanceStore } from '@/components/reports/balance/balance.store'
import Money from '@/components/shared/Money'
import { useRouter } from '@/hooks/useAppRouter'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { buildPeriodPayload } from '@/utils/balancePeriods'
import { readBalancePeriod } from '@/utils/balanceInsights'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Loader2, Scale } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Баланс на телефоне.
 *
 * Таблицу со статьями и колонками по датам на телефон не перенести, да и
 * незачем: на ходу смотрят не строки баланса, а его состояние — сколько
 * активов, сколько долгов, сходится ли равенство и из чего всё состоит.
 * Поэтому здесь итоги, коэффициенты и состав полосами; полная таблица
 * осталась на компьютере.
 */

/** Полоса состава: доля статьи от целого. */
const CompositionBar = ({ name, value, total, currency, color }) => {
  const share = total ? Math.abs(value / total) * 100 : 0
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[14px] text-slate-700">{name}</span>
        <span className="shrink-0 text-[14px] font-semibold tabular-nums text-slate-900">
          <Money value={value} currency={currency} />
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full" style={{ width: `${Math.min(share, 100)}%`, background: color }} />
        </div>
        <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-slate-400">
          {Math.round(share)}%
        </span>
      </div>
    </div>
  )
}

/** Коэффициент: название, формула мелким шрифтом, значение справа. */
const RatioRow = ({ label, hint, value, suffix = '' }) => (
  <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0">
    <span className="min-w-0">
      <span className="block text-[14px] text-slate-700">{label}</span>
      {hint && <span className="mt-0.5 block text-[11px] text-slate-400">{hint}</span>}
    </span>
    <span className="shrink-0 text-[15px] font-bold tabular-nums text-slate-900">
      {value == null ? '—' : `${(Math.round(value * 100) / 100).toLocaleString('ru-RU')}${suffix}`}
    </span>
  </div>
)

const ASSET_COLORS = ['#0e73f6', '#38bdf8', '#818cf8', '#94a3b8', '#cbd5e1']
const FINANCING_COLORS = ['#8b5cf6', '#f59e0b', '#f87171', '#94a3b8', '#cbd5e1']

const MobileBalancePage = observer(() => {
  const t = useTranslations('Reports')
  const tm = useTranslations('Mobile')
  const router = useRouter()
  const [periodIndex, setPeriodIndex] = useState(null)
  const [periodOpen, setPeriodOpen] = useState(false)

  const { dateRange, selectedEntity, selectedCurrency, selectedCounterparties, selectedAccount, periodType } =
    balanceStore

  const filterData = {
    account_ids: selectedAccount || [],
    legal_entity_id: selectedEntity,
    user_currency_code: selectedCurrency,
    contr_agent_ids: selectedCounterparties,
    ...buildPeriodPayload(dateRange, periodType),
  }

  const { data, isLoading } = useQuery({
    queryKey: ['balance_report', 'multi', filterData],
    queryFn: () => apiClient.invokeFunction({ method: 'balance_report_multi', data: filterData }),
    select: (response) => (response?.data?.periods ? response.data : (response?.data?.data ?? response?.data)),
    refetchOnWindowFocus: false,
  })

  const periods = useMemo(() => data?.periods || [], [data])
  const activeIndex = periodIndex ?? Math.max(periods.length - 1, 0)
  const insight = useMemo(
    () => (periods.length ? readBalancePeriod(periods[activeIndex]?.data || []) : null),
    [periods, activeIndex]
  )

  const groupingOptions = useMemo(
    () => [
      { value: 'daily', label: t('balance.grouping.daily') },
      { value: 'monthly', label: t('balance.grouping.monthly') },
      { value: 'quarterly', label: t('balance.grouping.quarterly') },
      { value: 'yearly', label: t('balance.grouping.yearly') },
      { value: 'total', label: t('balance.grouping.total') },
    ],
    [t]
  )

  const currency = selectedCurrency
  const balanced = insight ? Math.abs(insight.difference) < 1 : false

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader title={t('balance.title')} onBack={() => router.push('/m/reports')} />

      <button
        type="button"
        onClick={() => setPeriodOpen(true)}
        className="flex w-full items-center gap-2 rounded-2xl bg-white px-4 py-3 text-left active:bg-slate-50"
      >
        <CalendarDays size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-slate-900">
          {periods[activeIndex]?.as_of ? moment(periods[activeIndex].as_of).format('DD.MM.YYYY') : '—'}
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

      {!isLoading && !insight && <MEmpty icon={Scale} title={tm('reports.noData')} />}

      {!isLoading && insight && (
        <>
          {/* Срез на дату */}
          {periods.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {periods.map((period, index) => (
                <button
                  key={period.as_of || index}
                  type="button"
                  onClick={() => setPeriodIndex(index)}
                  className={cn(
                    'shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap',
                    activeIndex === index ? 'bg-[#0e73f6] text-white' : 'bg-white text-slate-600'
                  )}
                >
                  {moment(period.as_of).format('DD.MM.YY')}
                </button>
              ))}
            </div>
          )}

          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <ReportTile label={t('balance.charts.kpi.assets')} value={insight.assets} currency={currency} />
            <ReportTile label={t('balance.charts.kpi.liabilities')} value={insight.liabilities} currency={currency} tone="out" />
            <ReportTile label={t('balance.charts.kpi.equity')} value={insight.equity} currency={currency} tone="in" />
            <ReportTile
              label={t('balance.charts.kpi.workingCapital')}
              value={insight.workingCapital}
              currency={currency}
              tone={insight.workingCapital >= 0 ? 'in' : 'out'}
            />
          </div>

          {/* Сходится ли баланс */}
          <MCard className="mt-2.5 flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-[13px] text-slate-500">{t('balance.formula')}</span>
              <span
                className={cn(
                  'mt-0.5 block text-[15px] font-bold',
                  balanced ? 'text-emerald-600' : 'text-amber-600'
                )}
              >
                {balanced ? t('balance.charts.equation.ok') : tm('reports.notBalanced')}
              </span>
            </span>
            {!balanced && (
              <span className="shrink-0 text-[15px] font-bold tabular-nums text-amber-600">
                <Money value={insight.difference} currency={currency} />
              </span>
            )}
          </MCard>

          {/* Коэффициенты */}
          <MCard list className="mt-2.5">
            <RatioRow
              label={t('balance.charts.kpi.currentRatio')}
              hint={t('balance.charts.kpi.currentRatioHint')}
              value={insight.currentRatio}
            />
            <RatioRow
              label={t('balance.charts.kpi.quickRatio')}
              hint={t('balance.charts.kpi.quickRatioHint')}
              value={insight.quickRatio}
            />
            <RatioRow
              label={t('balance.charts.kpi.debtToEquity')}
              hint={t('balance.charts.kpi.debtToEquityHint')}
              value={insight.debtToEquity}
            />
            <RatioRow label={t('balance.charts.kpi.equityShare')} value={insight.equityShare} suffix="%" />
          </MCard>

          {/* Состав */}
          {insight.assetParts.length > 0 && (
            <>
              <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">
                {t('balance.charts.assetsPie.title')}
              </div>
              <MCard list>
                {insight.assetParts.slice(0, 6).map((part, index) => (
                  <CompositionBar
                    key={part.name}
                    name={part.name}
                    value={part.value}
                    total={insight.assets}
                    currency={currency}
                    color={ASSET_COLORS[index % ASSET_COLORS.length]}
                  />
                ))}
              </MCard>
            </>
          )}

          {insight.financingParts.length > 0 && (
            <>
              <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">
                {t('balance.charts.financingPie.title')}
              </div>
              <MCard list>
                {insight.financingParts.slice(0, 6).map((part, index) => (
                  <CompositionBar
                    key={part.name}
                    name={part.name}
                    value={part.value}
                    total={insight.assets}
                    currency={currency}
                    color={FINANCING_COLORS[index % FINANCING_COLORS.length]}
                  />
                ))}
              </MCard>
            </>
          )}

          <p className="px-2 pt-3 text-[11px] leading-relaxed text-slate-400">{tm('reports.balanceHint')}</p>
        </>
      )}

      <ReportPeriodSheet
        open={periodOpen}
        onClose={() => setPeriodOpen(false)}
        start={dateRange?.start}
        end={dateRange?.end}
        grouping={periodType}
        groupingOptions={groupingOptions}
        onApply={({ start, end, grouping }) => {
          balanceStore.setDateRange({ start, end })
          balanceStore.setPeriodType(grouping)
          setPeriodIndex(null)
        }}
      />
    </div>
  )
})

export default MobileBalancePage

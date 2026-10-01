'use client'

import ReportPeriodSheet from '@/components/mobile/ReportPeriodSheet'
import PeriodBars from '@/components/mobile/PeriodBars'
import { ReportTile, TreeRow } from '@/components/mobile/ReportTree'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import { balanceStore } from '@/components/reports/balance/balance.store'
import Money from '@/components/shared/Money'
import { useRouter } from '@/hooks/useAppRouter'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { buildPeriodPayload, formatCutoffTitle, mergePeriodRows } from '@/utils/balancePeriods'
import { readBalancePeriod, readBalanceSeries } from '@/utils/balanceInsights'
import { AXIS_LABEL, SPLIT_LINE } from '@/components/Indicators/shared/chartTheme'
import { formatValueLength } from '@/utils/helpers'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, LayoutGrid, Loader2, Rows3, Scale } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Баланс на телефоне — как на компьютере, двумя видами.
 *
 * «Таблица» — как ОПиУ на телефоне: дата выбирается столбиками сверху,
 * ниже статьи баланса деревом на эту дату — без прокрутки вбок. «Диаграммы» — состояние баланса:
 * итоги, равенство, коэффициенты, состав кольцами и динамика по срезам.
 * Данные одни и те же — balance_report_multi, как на компьютере.
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

/** Кольцо состава: доли статей, в центре — итог. */
const CompositionDonut = ({ parts, total, colors, currency }) => {
  const option = useMemo(
    () => ({
      tooltip: { show: false },
      series: [
        {
          type: 'pie',
          radius: ['64%', '92%'],
          center: ['50%', '50%'],
          label: { show: false },
          labelLine: { show: false },
          silent: true,
          data: parts.map((part, index) => ({
            name: part.name,
            value: Math.abs(part.value),
            itemStyle: { color: colors[index % colors.length], borderColor: '#fff', borderWidth: 2 },
          })),
        },
      ],
    }),
    [parts, colors]
  )

  return (
    <div className="relative mx-auto h-[180px] w-[180px]">
      <ReactECharts option={option} notMerge style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span className="text-[15px] leading-tight font-bold text-slate-900">
          <Money value={total} currency="" />
        </span>
        <span className="text-[11px] text-slate-400">{currency}</span>
      </div>
    </div>
  )
}

const ASSET_COLORS = ['#0e73f6', '#38bdf8', '#818cf8', '#94a3b8', '#cbd5e1']
const FINANCING_COLORS = ['#8b5cf6', '#f59e0b', '#f87171', '#94a3b8', '#cbd5e1']

const MobileBalancePage = observer(() => {
  const t = useTranslations('Reports')
  const tm = useTranslations('Mobile')
  const router = useRouter()
  const ti = useTranslations('Indicators')
  const [periodIndex, setPeriodIndex] = useState(null)
  const [periodOpen, setPeriodOpen] = useState(false)
  // Таблица или диаграммы — как переключатель на компьютере
  const [view, setView] = useState('table')

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

  // Таблица: срезы склеены в одно дерево, у каждой статьи значения по датам
  const rows = useMemo(() => mergePeriodRows(periods), [periods])
  // Дерево для TreeRow (как в ОПиУ): вложенные статьи — в details
  const tree = useMemo(() => {
    const toNode = (row) => ({ id: row.uniquePath ?? row.id, name: row.name, values: row.values, details: (row.children || []).map(toNode) })
    return rows.map(toNode)
  }, [rows])

  // Даты срезов: ключ периода — as_of, подпись — «30 сен»
  const keys = useMemo(() => periods.map((period) => period.as_of), [periods])
  const withYear = useMemo(() => new Set(periods.map((period) => String(period.as_of).slice(0, 4))).size > 1, [periods])
  const activeKey = periods[activeIndex]?.as_of
  // Столбики срезов — и выбор даты: активы вверх, обязательства рядом
  const bars = useMemo(
    () =>
      periods.map((period) => {
        const snapshot = readBalancePeriod(period?.data || [])
        return { key: period.as_of, title: formatCutoffTitle(period.as_of, withYear), up: snapshot.assets, down: snapshot.liabilities }
      }),
    [periods, withYear]
  )

  // Диаграммы: динамика активов, обязательств и капитала по срезам
  const series = useMemo(() => readBalanceSeries(periods), [periods])
  const dynamicsOption = useMemo(() => {
    const line = (name, key, color, dashed) => ({
      name,
      type: 'line',
      data: series.map((item) => Math.round(item[key])),
      smooth: 0.25,
      showSymbol: series.length <= 12,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { width: 2.5, color, type: dashed ? 'dashed' : 'solid' },
      itemStyle: { color, borderColor: '#fff', borderWidth: 2 },
    })
    return {
      tooltip: { trigger: 'axis', confine: true },
      legend: { bottom: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10, textStyle: { color: '#64748b', fontSize: 11 } },
      grid: { left: 4, right: 8, top: 12, bottom: 30, containLabel: true },
      xAxis: {
        type: 'category',
        data: series.map((item) => formatCutoffTitle(item.asOf, true)),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { ...AXIS_LABEL, interval: 'auto' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: SPLIT_LINE,
        axisLabel: {
          ...AXIS_LABEL,
          formatter: (value) =>
            value === 0 ? '0' : formatValueLength(value, ti('common.billion'), ti('common.million'), ti('common.thousand')),
        },
      },
      series: [
        line(t('balance.charts.dynamics.assets'), 'assets', '#0e73f6'),
        line(t('balance.charts.dynamics.liabilities'), 'liabilities', '#f59e0b'),
        line(t('balance.charts.dynamics.equity'), 'equity', '#8b5cf6', true),
      ],
    }
  }, [series, t, ti])

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

      {/* Таблица или диаграммы */}
      <div className="mt-2.5 flex rounded-2xl bg-white p-1">
        {[
          { value: 'table', label: t('balance.charts.view.table'), icon: Rows3 },
          { value: 'charts', label: t('balance.charts.view.charts'), icon: LayoutGrid },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setView(item.value)}
            aria-pressed={view === item.value}
            className={cn(
              'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold',
              view === item.value ? 'bg-[#0e73f6] text-white' : 'text-slate-500'
            )}
          >
            <item.icon size={15} aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-slate-400" aria-hidden="true" />
        </div>
      )}

      {!isLoading && !insight && <MEmpty icon={Scale} title={tm('reports.noData')} />}

      {!isLoading && insight && (
        <>
          {/* Дата среза: столбики, как в ОПиУ — касание выбирает дату */}
          {periods.length > 1 && (
            <div className="pt-3">
              <PeriodBars
                periods={bars}
                value={activeKey}
                onChange={(key) => setPeriodIndex(Math.max(0, keys.indexOf(key)))}
              />
            </div>
          )}

          {/* Таблица — как ОПиУ на телефоне: статьи на выбранную дату */}
          {view === 'table' && (
            <>
              <div className="px-1 pt-5 pb-2.5 text-[15px] font-bold text-slate-900">
                {activeKey ? moment(activeKey).format('D MMMM YYYY') : ''}
              </div>
              <MCard list>
                {tree.map((row) => (
                  <TreeRow key={row.id || row.name} row={row} periodKey={activeKey} keys={keys} currency={currency} />
                ))}
              </MCard>
            </>
          )}

          {view === 'charts' && (
          <>
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
              <MCard list className="pt-4">
                <CompositionDonut parts={insight.assetParts} total={insight.assets} colors={ASSET_COLORS} currency={currency} />
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
              <MCard list className="pt-4">
                <CompositionDonut parts={insight.financingParts} total={insight.assets} colors={FINANCING_COLORS} currency={currency} />
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

          {/* Динамика по срезам */}
          <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{t('balance.charts.dynamics.title')}</div>
          <MCard className="px-3">
            {series.length > 1 ? (
              <div className="h-[240px] w-full">
                <ReactECharts option={dynamicsOption} notMerge style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
              </div>
            ) : (
              <p className="py-8 text-center text-[13px] text-slate-400">{t('balance.charts.dynamics.needPeriods')}</p>
            )}
          </MCard>
          </>
          )}
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

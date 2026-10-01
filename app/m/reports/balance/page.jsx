'use client'

import ReportPeriodSheet from '@/components/mobile/ReportPeriodSheet'
import { ReportTile } from '@/components/mobile/ReportTree'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import { balanceStore } from '@/components/reports/balance/balance.store'
import Money from '@/components/shared/Money'
import { useRouter } from '@/hooks/useAppRouter'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { buildColumns, buildPeriodPayload, collectInitialExpanded, formatCutoffTitle, mergePeriodRows } from '@/utils/balancePeriods'
import { readBalancePeriod, readBalanceSeries } from '@/utils/balanceInsights'
import { AXIS_LABEL, SPLIT_LINE } from '@/components/Indicators/shared/chartTheme'
import { formatValueLength } from '@/utils/helpers'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ChevronDown, ChevronRight, LayoutGrid, Loader2, Rows3, Scale } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { Fragment, useMemo, useState } from 'react'

/**
 * Баланс на телефоне — как на компьютере, двумя видами.
 *
 * «Таблица» — как на компьютере: статьи строками, у каждой даты (дня,
 * месяца, года) своя колонка; таблица прокручивается вбок, а колонка
 * статей закреплена слева. «Диаграммы» — состояние баланса:
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

/**
 * Строки таблицы баланса: статья в закреплённой левой колонке, суммы — по
 * колонкам дат. Фоны непрозрачные: при прокрутке вбок цифры уходят под
 * колонку статей и не должны просвечивать сквозь неё.
 */
const BalanceRows = ({ rows, level = 0, columns, expanded, onToggle }) =>
  rows.map((row) => {
    const children = row.children || []
    const hasChildren = children.length > 0
    const isRoot = level === 0
    const isSection = level === 1
    const path = row.uniquePath ?? row.id
    const open = isRoot || expanded(path)
    const rowBg = isRoot ? 'bg-slate-100' : isSection ? 'bg-slate-50' : 'bg-white'
    const textTone = isRoot ? 'font-bold text-slate-900' : isSection ? 'font-semibold text-slate-800' : 'text-slate-600'

    return (
      <Fragment key={path}>
        <tr className={cn('border-b', isRoot ? 'border-slate-200' : 'border-slate-100')}>
          <td
            className={cn(
              'sticky left-0 z-10 w-[150px] min-w-[150px] border-r border-slate-200 py-2.5 pr-2 align-top text-[13px] leading-snug',
              rowBg,
              textTone,
              isRoot && 'shadow-[inset_3px_0_0_#0e73f6]'
            )}
            style={{ paddingLeft: 10 + level * 12 }}
          >
            <button
              type="button"
              onClick={() => hasChildren && !isRoot && onToggle(path, !open)}
              className="flex w-full items-start gap-1 text-left"
            >
              <span className="mt-px flex h-4 w-3.5 shrink-0 items-center justify-center text-slate-400">
                {hasChildren && !isRoot && (open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />)}
              </span>
              <span className="min-w-0">{row.name}</span>
            </button>
          </td>
          {columns.map((column) => {
            const value = Number(row.values?.[column.key]) || 0
            return (
              <td
                key={column.key}
                className={cn(
                  'min-w-[112px] px-3 py-2.5 text-right align-top text-[13px] whitespace-nowrap tabular-nums',
                  rowBg,
                  textTone,
                  value < 0 && 'text-red-600'
                )}
              >
                {/* пустая статья — пусто, а не прочерк: как на компьютере */}
                {value !== 0 && <Money value={value} currency="" />}
              </td>
            )
          })}
        </tr>
        {hasChildren && open && (
          <BalanceRows rows={children} level={level + 1} columns={columns} expanded={expanded} onToggle={onToggle} />
        )}
      </Fragment>
    )
  })

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
  const [toggled, setToggled] = useState({})

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
  const initialExpanded = useMemo(() => collectInitialExpanded(rows), [rows])
  const isExpanded = (path) => toggled[path] ?? initialExpanded.has(path)

  // Колонки дат — те же, что в таблице на компьютере
  const columns = useMemo(() => buildColumns(periods), [periods])

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
          {/* Срез на дату — для диаграмм; в таблице все даты колонками */}
          {view === 'charts' && periods.length > 1 && (
            <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
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

          {/* Таблица — как на компьютере: у каждой даты своя колонка,
              таблица прокручивается вбок, колонка статей закреплена слева */}
          {view === 'table' && (
            // isolate: закреплённая колонка поднимается только внутри таблицы,
            // а не над панелью разделов внизу экрана
            <div className="isolate mt-2.5 overflow-hidden rounded-[24px] bg-white">
              <div className="overflow-x-auto overscroll-x-contain">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="sticky left-0 z-20 w-[150px] min-w-[150px] border-r border-slate-200 bg-white px-3 py-2.5 text-left text-[11px] font-semibold tracking-[0.04em] text-slate-400 uppercase">
                        {t('balance.accountHeader')}
                      </th>
                      {columns.map((column) => (
                        <th
                          key={column.key}
                          className="min-w-[112px] bg-white px-3 py-2.5 text-right text-[11px] font-semibold tracking-[0.04em] whitespace-nowrap text-slate-400 uppercase"
                        >
                          {column.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <BalanceRows
                      rows={rows}
                      columns={columns}
                      expanded={isExpanded}
                      onToggle={(path, open) => setToggled((prev) => ({ ...prev, [path]: open }))}
                    />
                  </tbody>
                </table>
              </div>
            </div>
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

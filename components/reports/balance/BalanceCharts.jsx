'use client'

import { AXIS_LABEL, SPLIT_LINE, TOOLTIP_BOX } from '@/components/Indicators/shared/chartTheme'
import KpiCard from '@/components/shared/KpiCard/KpiCard'
import { cn } from '@/lib/utils'
import { formatNumber, formatTotalSumma, formatValueLength } from '@/utils/helpers'
import { formatCutoffTitle } from '@/utils/balancePeriods'
import { readBalancePeriod, readBalanceSeries } from '@/utils/balanceInsights'
import ReactECharts from 'echarts-for-react'
import { Boxes, CheckCircle2, Coins, Gauge, Layers, Percent, Scale, TriangleAlert, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

const money = (value) => formatNumber(formatTotalSumma(value, 0)) || '0'
const ratio = (value) => (value == null ? '—' : `${(Math.round(value * 100) / 100).toLocaleString('ru-RU')}x`)
const share = (value) => (value == null ? '—' : `${Math.round(value * 10) / 10}%`)

// Активы — синие и бирюзовые, источники финансирования — фиолетовые и тёплые:
// две диаграммы стоят рядом, и одинаковая палитра сливала бы их
const ASSET_COLORS = ['#0e73f6', '#38bdf8', '#14b8a6', '#60a5fa', '#818cf8', '#93c5fd', '#a5f3fc', '#c7d2fe']
const FINANCING_COLORS = ['#8b5cf6', '#f59e0b', '#f87171', '#a78bfa', '#fbbf24', '#fca5a5', '#c4b5fd', '#fed7aa']

const Card = ({ title, subtitle, children, className }) => (
  <div className={cn('flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5', className)}>
    <div className="mb-4 min-w-0">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
    </div>
    <div className="flex min-h-0 flex-1 flex-col">{children}</div>
  </div>
)

/** Круговая диаграмма состава с подписями и долями справа. */
const CompositionPie = ({ parts, total, colors, currency }) => {
  const sum = parts.reduce((acc, part) => acc + Math.abs(part.value), 0) || 1

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'item',
        ...TOOLTIP_BOX,
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#0f172a', fontSize: 12 },
        formatter: (params) =>
          `<div style="font-weight:600;margin-bottom:4px;">${params.name}</div>` +
          `<div>${money(params.value)} ${currency || ''} · ${params.percent}%</div>`,
      },
      series: [
        {
          type: 'pie',
          radius: ['62%', '90%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          label: { show: false },
          labelLine: { show: false },
          data: parts.map((part, index) => ({
            name: part.name,
            value: Math.abs(part.value),
            itemStyle: { color: colors[index % colors.length], borderColor: '#fff', borderWidth: 2 },
          })),
        },
      ],
    }),
    [parts, colors, currency]
  )

  return (
    <div className="flex flex-col items-center gap-5 xl:flex-row">
      <div className="relative h-[190px] w-[190px] shrink-0">
        <ReactECharts option={option} notMerge style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-semibold tabular-nums text-slate-900">{money(total)}</span>
          <span className="text-[11px] text-slate-400">{currency}</span>
        </div>
      </div>

      <ul className="flex min-w-0 flex-1 flex-col gap-2">
        {parts.map((part, index) => (
          <li key={`${part.name}-${index}`} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colors[index % colors.length] }} />
              <span className="truncate text-slate-700" title={part.name}>{part.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-slate-500">{Math.round((Math.abs(part.value) / sum) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Коэффициент полосой: значение и из чего считается. */
const RatioRow = ({ label, value, formula, width, barClass }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-slate-700">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-slate-900">{value}</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={cn('h-full rounded-full', barClass)} style={{ width: `${Math.max(0, Math.min(100, width))}%` }} />
    </div>
    <span className="text-xs text-slate-400">{formula}</span>
  </div>
)

/**
 * Балансовый отчёт диаграммами: суммы и коэффициенты, равенство баланса,
 * состав активов и источников финансирования, динамика по срезам и оборотный
 * капитал. Второй вид того же отчёта — цифры те же, что в таблице.
 */
export default function BalanceCharts({ periods = [], currency }) {
  const t = useTranslations('Reports.balance.charts')
  // короткие подписи чисел («млрд / млн / тыс») берём там же, где графики показателей
  const ti = useTranslations('Indicators')

  const series = useMemo(() => readBalanceSeries(periods), [periods])
  const snapshot = useMemo(() => readBalancePeriod(periods.at(-1)?.data || []), [periods])
  const hasData = snapshot.assets !== 0 || snapshot.liabilities !== 0 || snapshot.equity !== 0

  const dynamicsOption = useMemo(() => {
    const labels = series.map((item) => formatCutoffTitle(item.asOf, true))
    const line = (name, key, color, dashed) => ({
      name,
      type: 'line',
      data: series.map((item) => Math.round(item[key])),
      smooth: 0.25,
      showSymbol: series.length <= 24,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { width: 2.5, color, type: dashed ? 'dashed' : 'solid' },
      itemStyle: { color, borderColor: '#fff', borderWidth: 2 },
    })

    return {
      tooltip: {
        trigger: 'axis',
        ...TOOLTIP_BOX,
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#0f172a', fontSize: 12 },
        axisPointer: { type: 'line', lineStyle: { color: '#94a3b8', type: 'dashed' } },
        valueFormatter: (value) => `${money(value)} ${currency || ''}`,
      },
      legend: { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 12, textStyle: { color: '#64748b', fontSize: 12 } },
      grid: { left: 8, right: 12, top: 16, bottom: 34, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { ...AXIS_LABEL, interval: 'auto', rotate: 0 },
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
        line(t('dynamics.assets'), 'assets', '#0e73f6'),
        line(t('dynamics.liabilities'), 'liabilities', '#f59e0b'),
        line(t('dynamics.equity'), 'equity', '#8b5cf6', true),
      ],
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, currency])

  if (!hasData) {
    return <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-400">{t('noData')}</div>
  }

  const balanced = Math.abs(snapshot.difference) < 1
  const liabilitiesShare = snapshot.assets > 0 ? (snapshot.liabilities / snapshot.assets) * 100 : 0
  const equityShare = snapshot.equityShare ?? 0

  const kpis = [
    { key: 'assets', label: t('kpi.assets'), value: Math.round(snapshot.assets), currency, hint: t('kpi.assetsHint'), icon: Layers },
    { key: 'liabilities', label: t('kpi.liabilities'), value: Math.round(snapshot.liabilities), currency, hint: t('kpi.liabilitiesHint'), icon: Scale },
    { key: 'equity', label: t('kpi.equity'), value: Math.round(snapshot.equity), currency, hint: t('kpi.equityHint'), icon: Wallet },
    { key: 'working', label: t('kpi.workingCapital'), value: Math.round(snapshot.workingCapital), currency, hint: t('kpi.workingCapitalHint'), icon: Coins, tone: 'signed' },
  ]

  const workingRows = [
    { label: t('workingCapital.cash'), value: snapshot.cash },
    { label: t('workingCapital.receivablesInventory'), value: snapshot.receivables + snapshot.inventory },
    { label: t('workingCapital.other'), value: snapshot.otherCurrentAssets },
    { label: t('workingCapital.currentAssets'), value: snapshot.currentAssets, strong: true },
    { label: t('workingCapital.currentLiabilities'), value: -snapshot.currentLiabilities },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Суммы и коэффициенты */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map(({ key, ...kpi }) => (
          <KpiCard key={key} {...kpi} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label={t('kpi.currentRatio')} value={ratio(snapshot.currentRatio)} hint={t('kpi.currentRatioHint')} icon={Gauge} />
        <KpiCard label={t('kpi.quickRatio')} value={ratio(snapshot.quickRatio)} hint={t('kpi.quickRatioHint')} icon={Gauge} />
        <KpiCard label={t('kpi.debtToEquity')} value={ratio(snapshot.debtToEquity)} hint={t('kpi.debtToEquityHint')} icon={Boxes} />
        <KpiCard label={t('kpi.equityShare')} value={share(snapshot.equityShare)} hint={t('kpi.equityShareHint')} icon={Percent} />
      </div>

      {/* Равенство баланса и ликвидность */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card title={t('equation.title')} subtitle={t('equation.subtitle')}>
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: t('equation.assets'), value: snapshot.assets, tint: 'bg-[#eef4ff]' },
              { label: t('equation.liabilities'), value: snapshot.liabilities, tint: 'bg-amber-50' },
              { label: t('equation.equity'), value: snapshot.equity, tint: 'bg-violet-50' },
            ].map((item, index) => (
              <div key={item.label} className="flex items-center gap-3">
                {index > 0 && <span className="text-lg text-slate-400">{index === 1 ? '=' : '+'}</span>}
                <div className={cn('min-w-[150px] rounded-lg px-4 py-3', item.tint)}>
                  <div className="text-xs text-slate-500">{item.label}</div>
                  <div className="text-lg font-semibold tabular-nums text-slate-900">
                    {money(item.value)} <span className="text-xs font-normal text-slate-400">{currency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={cn('mt-4 flex items-center gap-2 text-sm', balanced ? 'text-emerald-700' : 'text-amber-700')}>
            {balanced ? <CheckCircle2 size={16} aria-hidden="true" /> : <TriangleAlert size={16} aria-hidden="true" />}
            {balanced ? t('equation.ok') : t('equation.fail', { value: `${money(snapshot.difference)} ${currency || ''}` })}
          </div>

          {/* Чем профинансированы активы: доля обязательств и капитала */}
          <div className="mt-auto pt-5">
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-amber-400" style={{ width: `${Math.max(0, Math.min(100, liabilitiesShare))}%` }} />
              <div className="h-full bg-violet-500" style={{ width: `${Math.max(0, Math.min(100, equityShare))}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>{t('equation.liabilitiesShare', { percent: Math.round(liabilitiesShare) })}</span>
              <span>{t('equation.equityShare', { percent: Math.round(equityShare) })}</span>
            </div>
          </div>
        </Card>

        <Card title={t('liquidity.title')} subtitle={t('liquidity.subtitle')}>
          <div className="flex flex-col gap-5">
            <RatioRow
              label={t('kpi.currentRatio')}
              value={ratio(snapshot.currentRatio)}
              formula={t('kpi.currentRatioHint')}
              width={(snapshot.currentRatio ?? 0) * 33}
              barClass="bg-[#0e73f6]"
            />
            <RatioRow
              label={t('kpi.quickRatio')}
              value={ratio(snapshot.quickRatio)}
              formula={t('kpi.quickRatioHint')}
              width={(snapshot.quickRatio ?? 0) * 33}
              barClass="bg-sky-400"
            />
            <RatioRow
              label={t('kpi.debtToEquity')}
              value={ratio(snapshot.debtToEquity)}
              formula={t('kpi.debtToEquityHint')}
              width={(snapshot.debtToEquity ?? 0) * 33}
              barClass="bg-amber-400"
            />
          </div>
          <p className="mt-auto pt-4 text-xs text-slate-400">{t('liquidity.note')}</p>
        </Card>
      </div>

      {/* Состав активов и источников */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title={t('assetsPie.title')} subtitle={t('assetsPie.subtitle')}>
          <CompositionPie parts={snapshot.assetParts} total={snapshot.assets} colors={ASSET_COLORS} currency={currency} />
        </Card>
        <Card title={t('financingPie.title')} subtitle={t('financingPie.subtitle')}>
          <CompositionPie parts={snapshot.financingParts} total={snapshot.assets} colors={FINANCING_COLORS} currency={currency} />
        </Card>
      </div>

      {/* Динамика и оборотный капитал */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card title={t('dynamics.title')} subtitle={t('dynamics.subtitle')}>
          {series.length > 1 ? (
            <div className="h-[300px] w-full">
              <ReactECharts option={dynamicsOption} notMerge style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center py-16 text-center text-sm text-slate-400">
              {t('dynamics.needPeriods')}
            </div>
          )}
        </Card>

        <Card title={t('workingCapital.title')} subtitle={t('workingCapital.subtitle')}>
          <ul className="flex flex-col">
            {workingRows.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 text-sm">
                <span className={cn('truncate', row.strong ? 'font-medium text-slate-900' : 'text-slate-600')}>{row.label}</span>
                <span className={cn('shrink-0 tabular-nums', row.value < 0 ? 'text-red-600' : 'text-slate-900', row.strong && 'font-semibold')}>
                  {money(row.value)} <span className="text-xs font-normal text-slate-400">{currency}</span>
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="font-semibold text-slate-900">{t('workingCapital.total')}</span>
              <span className={cn('font-semibold tabular-nums', snapshot.workingCapital < 0 ? 'text-red-600' : 'text-emerald-700')}>
                {money(snapshot.workingCapital)} <span className="text-xs font-normal text-slate-400">{currency}</span>
              </span>
            </li>
          </ul>
          <p className="mt-auto rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">{t('workingCapital.hint')}</p>
        </Card>
      </div>
    </div>
  )
}

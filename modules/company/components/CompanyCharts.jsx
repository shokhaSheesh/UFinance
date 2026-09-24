'use client'

import { AXIS_LABEL, CHART_COLORS, SPLIT_LINE, TOOLTIP_BOX } from '@/components/Indicators/shared/chartTheme'
import { localizeMonthTitle } from '@/components/Indicators/utils/localizeMonth'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { cn } from '@/lib/utils'
import { formatNumber, formatTotalSumma, formatValueLength } from '@/utils/helpers'
import ReactECharts from 'echarts-for-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'

const money = (value) => formatNumber(formatTotalSumma(value, 0)) || '0'

/** Подпись оси со «млн / тыс», чтобы длинные суммы не разъезжались. */
const useShortFormatter = () => {
  const t = useTranslations('Indicators')
  const billion = t('common.billion')
  const million = t('common.million')
  const thousand = t('common.thousand')
  return (value) => (value === 0 ? '0' : formatValueLength(value, billion, million, thousand))
}

const baseTooltip = {
  trigger: 'axis',
  ...TOOLTIP_BOX,
  backgroundColor: 'rgba(255, 255, 255, 0.97)',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  textStyle: { color: '#0f172a', fontSize: 12 },
}

const rowsTooltip = (labels, series, currency) => (params) => {
  const index = params?.[0]?.dataIndex
  if (index == null) return ''
  const lines = series
    .map(
      (item) => `
        <div style="display:flex;justify-content:space-between;gap:16px;">
          <span style="color:#64748b;display:flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;border-radius:9999px;background:${item.color};"></span>${item.name}
          </span>
          <span style="font-weight:600;">${money(item.data[index])} ${currency || ''}</span>
        </div>`
    )
    .join('')
  return `<div style="font-weight:600;margin-bottom:6px;">${labels[index]}</div>${lines}`
}

/** Доходы, расходы и прибыль по периодам — столбиками. */
export function RevenueExpenseChart({ pnl }) {
  const t = useTranslations('Company')
  const locale = useLocale()
  const shortValue = useShortFormatter()
  const currency = GlobalCurrency?.name
  const labels = useMemo(
    () => (pnl.legend || []).map((item) => localizeMonthTitle(locale, item.startDate)),
    [pnl.legend, locale]
  )

  const series = [
    { name: t('trend.revenue'), color: CHART_COLORS.income, data: pnl.revenue },
    { name: t('trend.expenses'), color: CHART_COLORS.expense, data: pnl.expenses },
    { name: t('trend.profit'), color: CHART_COLORS.result, data: pnl.profit },
  ]

  const option = useMemo(
    () => ({
      tooltip: {
        ...baseTooltip,
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
        formatter: rowsTooltip(labels, series, currency),
      },
      grid: { left: 8, right: 12, top: 16, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { ...AXIS_LABEL, interval: 'auto', rotate: 0 },
      },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: SPLIT_LINE, axisLabel: { ...AXIS_LABEL, formatter: shortValue } },
      series: series.map((item, index) => ({
        name: item.name,
        type: index === 2 ? 'line' : 'bar',
        data: item.data,
        barMaxWidth: 18,
        smooth: index === 2 ? 0.25 : undefined,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: item.color, borderRadius: index === 2 ? 0 : [4, 4, 0, 0], borderColor: '#fff', borderWidth: index === 2 ? 2 : 0 },
        lineStyle: index === 2 ? { width: 2.5, color: item.color } : undefined,
      })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labels, pnl.revenue, pnl.expenses, pnl.profit, currency]
  )

  return <ChartCard title={t('trend.title')} subtitle={t('trend.subtitle')} series={series} option={option} height={280} />
}

/** Поступления и выплаты — линиями, с итогом под графиком. */
export function CashFlowChart({ cash }) {
  const t = useTranslations('Company')
  const locale = useLocale()
  const shortValue = useShortFormatter()
  const currency = GlobalCurrency?.name
  const labels = useMemo(
    () => (cash.legend || []).map((item) => localizeMonthTitle(locale, item.startDate)),
    [cash.legend, locale]
  )

  const series = [
    { name: t('cash.receipts'), color: CHART_COLORS.income, data: cash.receipts },
    { name: t('cash.payments'), color: CHART_COLORS.expense, data: cash.payments },
  ]

  const option = useMemo(
    () => ({
      tooltip: {
        ...baseTooltip,
        axisPointer: { type: 'line', lineStyle: { color: '#94a3b8', type: 'dashed' } },
        formatter: rowsTooltip(labels, series, currency),
      },
      grid: { left: 8, right: 12, top: 16, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { ...AXIS_LABEL, interval: 'auto', rotate: 0 },
      },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: SPLIT_LINE, axisLabel: { ...AXIS_LABEL, formatter: shortValue } },
      series: series.map((item) => ({
        name: item.name,
        type: 'line',
        data: item.data,
        smooth: 0.25,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5, color: item.color },
        itemStyle: { color: item.color, borderColor: '#fff', borderWidth: 2 },
      })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labels, cash.receipts, cash.payments, currency]
  )

  return (
    <ChartCard title={t('cash.title')} subtitle={t('cash.subtitle')} series={series} option={option} height={220}>
      <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-2.5">
        <span className="text-sm text-slate-600">{t('cash.net')}</span>
        <span className={cn('text-lg font-semibold tabular-nums', cash.net >= 0 ? 'text-emerald-700' : 'text-red-600')}>
          {cash.net > 0 ? '+' : ''}
          {money(cash.net)} <span className="text-sm font-normal text-slate-400">{currency}</span>
        </span>
      </div>
    </ChartCard>
  )
}

/** Карточка графика: заголовок, легенда, сам график. */
export function ChartCard({ title, subtitle, series = [], option, height = 260, children }) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {series.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {series.map((item) => (
              <span key={item.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
                {item.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ height }}>
        <ReactECharts option={option} notMerge style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
      </div>
      {children}
    </div>
  )
}

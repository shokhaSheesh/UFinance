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
  ...TOOLTIP_BOX,
  backgroundColor: 'rgba(255, 255, 255, 0.97)',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  textStyle: { color: '#0f172a', fontSize: 12 },
}

/**
 * Карточка графика: заголовок, легенда, сам график.
 */
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

/**
 * «Из чего сложилась прибыль» — водопад: доход, минус расход, остаток прибыли.
 * На «Показателях» те же суммы показаны помесячными столбиками; здесь важен
 * не ход по месяцам, а итог периода одной картинкой.
 */
export function ProfitWaterfall({ pnl }) {
  const t = useTranslations('Company')
  const shortValue = useShortFormatter()
  const currency = GlobalCurrency?.name

  const revenue = Number(pnl.revenueTotal) || 0
  const expenses = Number(pnl.expensesTotal) || 0
  const profit = Number(pnl.profitTotal) || 0

  const option = useMemo(() => {
    const labels = [t('waterfall.revenue'), t('waterfall.expenses'), t('waterfall.profit')]
    // столбик расходов «висит» от прибыли до дохода — видно, сколько съели расходы
    const base = [0, Math.min(profit, revenue), 0]
    const values = [revenue, Math.abs(expenses), Math.abs(profit)]
    const colors = [CHART_COLORS.income, CHART_COLORS.expense, profit < 0 ? CHART_COLORS.expense : CHART_COLORS.result]
    const real = [revenue, -Math.abs(expenses), profit]

    return {
      tooltip: {
        trigger: 'axis',
        ...baseTooltip,
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
        formatter: (params) => {
          const index = params?.[0]?.dataIndex
          if (index == null) return ''
          return `
            <div style="font-weight:600;margin-bottom:4px;">${labels[index]}</div>
            <div style="font-weight:600;">${money(real[index])} ${currency || ''}</div>
          `
        },
      },
      grid: { left: 8, right: 12, top: 24, bottom: 8, containLabel: true },
      xAxis: { type: 'category', data: labels, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { ...AXIS_LABEL } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: SPLIT_LINE, axisLabel: { ...AXIS_LABEL, formatter: shortValue } },
      series: [
        { type: 'bar', stack: 'total', silent: true, itemStyle: { color: 'transparent' }, emphasis: { disabled: true }, data: base, barMaxWidth: 96 },
        {
          type: 'bar',
          stack: 'total',
          barMaxWidth: 96,
          data: values.map((value, index) => ({ value, itemStyle: { color: colors[index], borderRadius: [6, 6, 0, 0] } })),
          label: {
            show: true,
            position: 'top',
            formatter: ({ dataIndex }) => money(real[dataIndex]),
            color: '#334155',
            fontSize: 12,
            fontWeight: 600,
          },
        },
      ],
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revenue, expenses, profit, currency, t])

  return <ChartCard title={t('waterfall.title')} subtitle={t('waterfall.subtitle')} option={option} height={280} />
}

/**
 * «Прибыль и деньги нарастающим итогом» — две линии: начисленная прибыль и
 * фактический денежный поток. Расхождение показывает, сколько заработанного
 * ещё не стало деньгами; на «Показателях» такого сравнения нет.
 */
export function ProfitVsCashChart({ pnl, cash }) {
  const t = useTranslations('Company')
  const locale = useLocale()
  const shortValue = useShortFormatter()
  const currency = GlobalCurrency?.name

  const labels = useMemo(
    () => (pnl.legend || []).map((item) => localizeMonthTitle(locale, item.startDate)),
    [pnl.legend, locale]
  )

  // нарастающий итог по периодам
  const { profitLine, cashLine, gap } = useMemo(() => {
    const running = (values = []) => {
      let sum = 0
      return values.map((value) => {
        sum += Number(value) || 0
        return Math.round(sum)
      })
    }
    const profitValues = running(pnl.profit)
    const cashValues = running((cash.receipts || []).map((value, index) => (Number(value) || 0) - (Number(cash.payments?.[index]) || 0)))
    return {
      profitLine: profitValues,
      cashLine: cashValues,
      gap: (profitValues.at(-1) || 0) - (cashValues.at(-1) || 0),
    }
  }, [pnl.profit, cash.receipts, cash.payments])

  const series = [
    { name: t('cumulative.profit'), color: CHART_COLORS.result, data: profitLine },
    { name: t('cumulative.cash'), color: CHART_COLORS.balance, data: cashLine },
  ]

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        ...baseTooltip,
        axisPointer: { type: 'line', lineStyle: { color: '#94a3b8', type: 'dashed' } },
        formatter: (params) => {
          const index = params?.[0]?.dataIndex
          if (index == null) return ''
          const rows = series
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
          return `<div style="font-weight:600;margin-bottom:6px;">${labels[index]}</div>${rows}`
        },
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
      series: [
        {
          name: series[0].name,
          type: 'line',
          data: profitLine,
          smooth: 0.25,
          showSymbol: false,
          lineStyle: { width: 2.5, color: series[0].color },
          itemStyle: { color: series[0].color },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.16)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.01)' },
              ],
            },
          },
        },
        {
          name: series[1].name,
          type: 'line',
          data: cashLine,
          smooth: 0.25,
          showSymbol: false,
          lineStyle: { width: 2.5, color: series[1].color, type: 'dashed' },
          itemStyle: { color: series[1].color },
        },
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labels, profitLine, cashLine, currency]
  )

  return (
    <ChartCard title={t('cumulative.title')} subtitle={t('cumulative.subtitle')} series={series} option={option} height={220}>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-2.5">
        <span className="min-w-0 text-sm text-slate-600" title={t('cumulative.gapHint')}>{t('cumulative.gap')}</span>
        <span className={cn('shrink-0 text-lg font-semibold tabular-nums', gap > 0 ? 'text-amber-600' : 'text-emerald-700')}>
          {gap > 0 ? '+' : ''}
          {money(gap)} <span className="text-sm font-normal text-slate-400">{currency}</span>
        </span>
      </div>
    </ChartCard>
  )
}

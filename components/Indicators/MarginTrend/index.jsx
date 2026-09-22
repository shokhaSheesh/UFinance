'use client'

import HintQuestion from '@/components/shared/HintQuestion'
import Loader from '@/components/shared/Loader'
import { GlobalCurrency } from '@/constants/globalCurrency'
import useMounted from '@/hooks/useMounted'
import { indicators } from '@/store/indicatos.store'
import { formatNumber, formatTotalSumma } from '@/utils/helpers'
import ReactECharts from 'echarts-for-react'
import { observer } from 'mobx-react-lite'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { AXIS_LABEL, CHART_COLORS, SPLIT_LINE, TOOLTIP_BOX } from '../shared/chartTheme'
import { findRow, useIndicatorProfit } from '../shared/indicatorQueries'
import StatTiles from '../shared/StatTiles'
import { localizeMonthTitle } from '../utils/localizeMonth'

const pct = (value) => (value == null ? '—' : `${(Math.round(value * 10) / 10).toLocaleString('ru-RU')}%`)
const money = (value) => formatNumber(formatTotalSumma(value, 0)) || '0'

/**
 * «Рентабельность по периодам» — чистая прибыль / доходы по каждому периоду.
 *
 * Блок «Прибыль» показывает суммы, но не отвечает на вопрос «мы стали
 * зарабатывать лучше или хуже?»: рост выручки может съедаться расходами.
 * Здесь это видно одной линией, со средней за период и лучшим / худшим
 * периодом. Данные — тот же отчёт P&L, что у блока «Прибыль» (общий кэш),
 * и тот же метод учёта.
 */
const MarginTrend = () => {
  const t = useTranslations('Indicators')
  const locale = useLocale()
  const mounted = useMounted()
  const { data, isFetching } = useIndicatorProfit()

  const { labels, margins, revenue, netProfit, average, best, worst } = useMemo(() => {
    const legend = data?.legend || []
    const rows = data?.rows || []
    const revenueRow = findRow(rows, 'revenue')
    const netRow = findRow(rows, 'net-profit')
    const keys = legend.map((item) => item.key)
    const read = (row) => keys.map((key) => Number(row?.values?.[key] ?? 0))

    const revenueValues = read(revenueRow)
    const netValues = read(netRow)
    const marginValues = revenueValues.map((rev, i) => (rev > 0 ? (netValues[i] / rev) * 100 : null))

    const totalRevenue = revenueValues.reduce((a, b) => a + b, 0)
    const totalNet = netValues.reduce((a, b) => a + b, 0)
    const withValue = marginValues.map((value, i) => ({ value, i })).filter((item) => item.value != null)
    const bestItem = withValue.reduce((acc, item) => (acc == null || item.value > acc.value ? item : acc), null)
    const worstItem = withValue.reduce((acc, item) => (acc == null || item.value < acc.value ? item : acc), null)

    return {
      labels: legend.map((item) => localizeMonthTitle(locale, item.startDate)),
      margins: marginValues,
      revenue: revenueValues,
      netProfit: netValues,
      average: totalRevenue > 0 ? (totalNet / totalRevenue) * 100 : null,
      best: bestItem,
      worst: worstItem,
    }
    // метод учёта входит в ключ запроса — data меняется вместе с ним
  }, [data, locale])

  const currency = mounted ? GlobalCurrency?.name : ''
  const hasData = margins.some((value) => value != null)

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        ...TOOLTIP_BOX,
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#0f172a', fontSize: 12 },
        axisPointer: { type: 'line', lineStyle: { color: '#94a3b8', type: 'dashed' } },
        formatter: (params) => {
          const i = params?.[0]?.dataIndex
          if (i == null) return ''
          return `
            <div style="font-weight: 600; margin-bottom: 6px;">${labels[i]}</div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: #64748b;">${t('margin.series')}</span>
              <span style="font-weight: 600;">${margins[i] == null ? t('margin.noRevenue') : pct(margins[i])}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: #64748b;">${t('margin.revenue')}</span>
              <span>${money(revenue[i])} ${currency || ''}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: #64748b;">${t('margin.netProfit')}</span>
              <span>${money(netProfit[i])} ${currency || ''}</span>
            </div>
          `
        },
      },
      grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
        axisLabel: { ...AXIS_LABEL, interval: 'auto', rotate: 0 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { ...AXIS_LABEL, formatter: '{value}%' },
        splitLine: SPLIT_LINE,
      },
      series: [
        {
          name: t('margin.series'),
          type: 'line',
          data: margins,
          connectNulls: true,
          smooth: 0.25,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { width: 2.5, color: CHART_COLORS.result },
          itemStyle: { color: CHART_COLORS.result, borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.18)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.02)' },
              ],
            },
          },
          markLine: {
            symbol: 'none',
            silent: true,
            data: [
              { yAxis: 0, lineStyle: { color: '#cbd5e1', type: 'solid', width: 1 }, label: { show: false } },
              ...(average != null
                ? [{
                    yAxis: Math.round(average * 10) / 10,
                    lineStyle: { color: '#64748b', type: 'dashed', width: 1 },
                    label: { formatter: `${t('margin.averageLine')} ${pct(average)}`, position: 'insideEndTop', color: '#64748b', fontSize: 11 },
                  }]
                : []),
            ],
          },
        },
      ],
    }),
    [labels, margins, revenue, netProfit, average, currency, t]
  )

  const methodLabel = indicators.profitableclientsMethod === 'cash' ? t('profit.cashMethod') : t('profit.accrualMethod')

  const tiles = [
    { label: t('margin.average'), value: pct(average), tone: average < 0 ? 'text-red-600' : average > 0 ? 'text-emerald-700' : undefined },
    { label: t('margin.best'), value: best ? `${labels[best.i]} · ${pct(best.value)}` : '—' },
    { label: t('margin.worst'), value: worst ? `${labels[worst.i]} · ${pct(worst.value)}` : '—', tone: worst?.value < 0 ? 'text-red-600' : undefined },
  ]

  return (
    <div className="relative w-full bg-white p-6">
      {isFetching && (
        <div className="absolute inset-0 z-100 flex items-center justify-center rounded-xl bg-white/80">
          <Loader />
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">{t('margin.title')}</h2>
          <span className="flex size-5 cursor-help items-center justify-center rounded-full bg-slate-100" title={t('margin.hint')}>
            <HintQuestion className="size-3 text-slate-400" />
          </span>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{methodLabel}</span>
      </div>

      {!hasData && !isFetching ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">{t('margin.noData')}</div>
      ) : (
        <div className="flex flex-col gap-4">
          <StatTiles items={tiles} />
          <div className="h-[300px] w-full">
            <ReactECharts option={option} notMerge style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
          </div>
        </div>
      )}
    </div>
  )
}

export default observer(MarginTrend)

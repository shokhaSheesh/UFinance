'use client'

import { AXIS_LABEL, CHART_COLORS, SPLIT_LINE } from '../shared/chartTheme'
import Segmented from '@/components/shared/Segmented/Segmented'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useMemo, useRef } from 'react'
import { apiClient } from '../../../lib/api/ucode/base'
import { indicators } from '../../../store/indicatos.store'
import Loader from '../../shared/Loader'
import { STATIC_PROFITABLE_CLIENTS_DATA } from '../constants/staticChartData'
import { enqueueIndicatorRequest } from '../utils/requestQueue'

const ProfitableClients = observer(() => {
  const t = useTranslations('Indicators')
  const chartRef = useRef(null)

  const { rangeMonth, profitableclientsMethod, setState, deals, accounts } = indicators

  const billion = t('common.billion')
  const million = t('common.million')

  const formatValue = (val) => {
    if (!val && val !== 0) return '0'
    const abs = Math.abs(val)
    if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1)} ${billion}`
    if (abs >= 1_000_000) return `${(Math.round(abs / 1_000_000)).toLocaleString('ru-RU')} ${million}`
    return abs.toLocaleString('ru-RU')
  }

  const clients80Label = t('profitableClients.legend.clients80')
  const incomeShareLabel = t('profitableClients.legend.incomeShare')
  const clients20Label = t('profitableClients.legend.clients20')

  const filterData = {
    period_from: rangeMonth?.start,
    period_to: rangeMonth?.end,
    period_type: indicators.periodType,
    accounting_method: profitableclientsMethod,
    sellingDealId: deals,
    project_ids: indicators.projects,
    accountId: accounts,
    currencyCode: indicators?.currencyCode
  }

  const { data: apiProfitableClientsData, isLoading, isFetching, isPending } = useQuery({
    queryKey: ['profitable_clients', filterData],
    queryFn: () => enqueueIndicatorRequest(() => apiClient.invokeFunction({ method: 'report_counterparties_financials', data: filterData })),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  // Fallback to static data if API returns no data
  const profitableClientsData = apiProfitableClientsData || STATIC_PROFITABLE_CLIENTS_DATA

  // chartData — names ga "Остальные" qo'shish
  const chartData = useMemo(() => {
    if (!profitableClientsData) return null

    const counterparties80 = profitableClientsData.counterparties80 || []
    const counterparties20 = profitableClientsData.counterparties20

    const names = counterparties80.map(c => c.name)
    const barData = counterparties80.map(c => c.summa)
    const lineData = counterparties80.map(c => c.percent_sum)

    if (counterparties20) {
      names.push(t('profitableClients.notSelected'))
      barData.push(counterparties20.summa)
      lineData.push(100)
    }

    return { names, barData, lineData, counterparties80, counterparties20 }
  }, [profitableClientsData, t])

  // option — ikkita alohida series, har biri o'z joyida
  const option = useMemo(() => {
    if (!chartData) return {}

    const { names, barData, lineData } = chartData
    const counterparties80Data = chartData.counterparties80 || []
    const hasOthers = !!chartData.counterparties20

    // Blue bars: counterparties80 joyida qiymat, oxirida null
    const blueSeriesData = counterparties80Data.map((c, idx) => ({
      value: barData[idx],
      percent: c.percent,
      itemStyle: { color: CHART_COLORS.income },
    }))
    if (hasOthers) {
      blueSeriesData.push(null) // oxirgi joy bo'sh
    }

    // Purple bar: faqat oxirgi joyda qiymat, qolganlari null
    const purpleSeriesData = [
      ...Array(counterparties80Data.length).fill(null), // barchasi bo'sh
    ]
    if (hasOthers) {
      purpleSeriesData.push({
        value: chartData.counterparties20.summa,
        percent: chartData.counterparties20.percent,
        itemStyle: { color: CHART_COLORS.secondary },
      })
    }

    return {
      // ... tooltip, legend, grid, xAxis, yAxis — o'zgarishsiz ...
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#0f172a', fontSize: 12 },
        formatter: (params) => {
          if (params.value == null) return ''
          const percent = params.data?.percent
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 8px; height: 8px; border-radius: 9999px; background: ${params.color};"></span>
              <span style="font-weight: 600;">${formatValue(params.value)} ${GlobalCurrency?.name || ''}</span>
              ${percent ? `<span style="color: #64748b;">${percent}%</span>` : ''}
            </div>
          `
        }
      },
      legend: { show: false },
      grid: { left: 8, right: 8, bottom: 8, top: 24, containLabel: true },
      xAxis: {
        type: 'category',
        data: names,
        // названия клиентов — горизонтально, длинные обрезаются «…» (полное — в подсказке)
        axisLabel: { ...AXIS_LABEL, interval: 'auto', rotate: 0, width: 140, overflow: 'truncate' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: [
        {
          type: 'value',
          position: 'left',
          axisLabel: { ...AXIS_LABEL, formatter: (val) => formatValue(val) },
          splitLine: SPLIT_LINE,
        },
        {
          type: 'value',
          position: 'right',
          min: 0,
          max: 100,
          axisLabel: { ...AXIS_LABEL, formatter: '{value}%' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: clients80Label,
          type: 'bar',
          stack: 'clients',
          data: blueSeriesData,
          barMaxWidth: 72,
        },
        {
          name: clients20Label,
          type: 'bar',
          stack: 'clients',
          data: purpleSeriesData,
          barMaxWidth: 72,
        },
        {
          name: incomeShareLabel,
          type: 'line',
          yAxisIndex: 1,
          data: lineData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: CHART_COLORS.accent, width: 2 },
          itemStyle: { color: CHART_COLORS.accent },
        },
      ],
    }
  }, [chartData, clients80Label, incomeShareLabel, clients20Label])

  return (
    <div className=" flex flex-col relative">
      {/* Header with method toggle */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="text-lg font-semibold text-slate-900">
            {t('profitableClients.title')},
            <span className="ml-1 text-slate-500" suppressHydrationWarning>{GlobalCurrency?.name || ''}</span>
          </h2>
          {/* Короткая легенда под заголовком — раньше длинные подписи стояли внизу под графиком */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1.5" title={clients80Label}>
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART_COLORS.income }} />
              {t('profitableClients.legendShort.clients80')}
            </span>
            <span className="flex items-center gap-1.5" title={clients20Label}>
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART_COLORS.secondary }} />
              {t('profitableClients.legendShort.clients20')}
            </span>
            <span className="flex items-center gap-1.5" title={incomeShareLabel}>
              <span className="h-0.5 w-3 rounded-full" style={{ background: CHART_COLORS.accent }} />
              {t('profitableClients.legendShort.incomeShare')}
            </span>
          </div>
        </div>
        {/* Раньше «Метод начисления» ставил cash, а «Кассовый метод» — несуществующий 'accural' */}
        <Segmented
          ariaLabel={t('profitableClients.title')}
          value={profitableclientsMethod}
          onChange={(value) => setState('profitableclientsMethod', value)}
          options={[
            { value: 'accrual', label: t('profitableClients.accrualMethod') },
            { value: 'cash', label: t('profitableClients.cashMethod') },
          ]}
        />
      </div>

      {/* Chart */}
      {(isLoading || isFetching || isPending) && (
        <div className="absolute inset-0 bg-white/80 z-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-neutral-200 border-t-[#0E73F6] rounded-full animate-spin" />
            <span className="text-sm text-neutral-600"><Loader /></span>
          </div>
        </div>
      )}
      <div className="flex items-start">
        <div className="flex-1 min-h-0 relative">
          {chartData && (
            <ReactECharts
              ref={chartRef}
              option={option}
              style={{ height: '420px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          )}
        </div>
      </div>
    </div>
  )
})

export default ProfitableClients

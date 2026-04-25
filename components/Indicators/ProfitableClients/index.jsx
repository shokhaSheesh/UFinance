'use client'

import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { observer } from 'mobx-react-lite'
import { useMemo, useRef } from 'react'
import { apiClient } from '../../../lib/api/ucode/base'
import { appStore } from '../../../store/app.store'
import { indicators } from '../../../store/indicatos.store'
import Loader from '../../shared/Loader'

const formatValue = (val) => {
  if (!val && val !== 0) return '0'
  const abs = Math.abs(val)
  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1)} млрд`
  if (abs >= 1_000_000) return `${(Math.round(abs / 1_000_000)).toLocaleString('ru-RU')} млн`
  return abs.toLocaleString('ru-RU')
}

const ProfitableClients = observer(() => {
  const chartRef = useRef(null)

  const { rangeMonth, profitableclientsMethod, setState, deals, accounts } = indicators

  const filterData = {
    period_from: rangeMonth?.start,
    period_to: rangeMonth?.end,
    period_type: indicators.periodType,
    accounting_method: profitableclientsMethod,
    sellingDealId: deals,
    accountId: accounts,
    currencyCode: indicators?.currencyCode
  }

  const { data: profitableClientsData, isLoading, isFetching, isPending } = useQuery({
    queryKey: ['profitable_clients', filterData],
    queryFn: () => apiClient.invokeFunction({ method: 'report_counterparties_financials', data: filterData }),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  // chartData — names ga "Остальные" qo'shish
  const chartData = useMemo(() => {
    if (!profitableClientsData) return null

    const counterparties80 = profitableClientsData.counterparties80 || []
    const counterparties20 = profitableClientsData.counterparties20

    const names = counterparties80.map(c => c.name)
    const barData = counterparties80.map(c => c.summa)
    const lineData = counterparties80.map(c => c.percent_sum)

    if (counterparties20) {
      names.push('Не выбран')
      barData.push(counterparties20.summa)
      lineData.push(100)
    }

    return { names, barData, lineData, counterparties80, counterparties20 }
  }, [profitableClientsData])

  // option — ikkita alohida series, har biri o'z joyida
  const inteval = chartData?.names?.length > 100 ? 30 : chartData?.names?.length > 50 ? 10 : chartData?.names?.length > 20 ? 4 : 0
  const option = useMemo(() => {
    if (!chartData) return {}

    const { names, barData, lineData } = chartData
    const counterparties80Data = chartData.counterparties80 || []
    const hasOthers = !!chartData.counterparties20

    // Blue bars: counterparties80 joyida qiymat, oxirida null
    const blueSeriesData = counterparties80Data.map((c, idx) => ({
      value: barData[idx],
      percent: c.percent,
      itemStyle: { color: '#22c5fd' },
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
        itemStyle: { color: '#a855f7' },
      })
    }

    return {
      // ... tooltip, legend, grid, xAxis, yAxis — o'zgarishsiz ...
      tooltip: {
        trigger: 'item',
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        formatter: (params) => {
          if (params.value == null) return ''
          const name = params.name
          const value = params.value
          const percent = params.data?.percent
          const bgColor = params.color || '#22c5fd'
          const formattedValue = formatValue(value)
          const percentText = percent ? `(${percent}%)` : ''
          return `
          <div style="
            background: ${bgColor};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-family: sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 140px;
          ">
            <div style="font-size: 14px; margin-bottom: 4px; opacity: 0.95;">${name}</div>
            <div style="font-size: 20px; font-weight: 600;">${formattedValue} ${percentText}</div>
          </div>
        `
        }
      },
      legend: {
        data: [
          { name: 'Клиенты, приносящие более 80% доходов', icon: 'roundRect', itemStyle: { color: '#22c5fd' } },
          { name: 'Доля доходов с накопительным итогом, %', icon: 'circle', itemStyle: { color: '#6366f1' } },
          { name: 'Клиенты, приносящие менее 20% доходов', icon: 'roundRect', itemStyle: { color: '#a855f7' } },
        ],
        bottom: 0,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 16 },
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: { interval: inteval, rotate: 30, fontSize: 16, color: '#64748b' },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: [
        {
          type: 'value',
          position: 'left',
          axisLabel: { formatter: (val) => formatValue(val), color: '#64748b', fontSize: 16 },
          splitLine: { lineStyle: { color: '#f1f5f9' } },
        },
        {
          type: 'value',
          position: 'right',
          min: 0,
          max: 100,
          axisLabel: { formatter: '{value}%', color: '#64748b', fontSize: 18 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Клиенты, приносящие более 80% доходов',
          type: 'bar',
          stack: 'clients',
          data: blueSeriesData,
          barWidth: '90%',
        },
        {
          name: 'Клиенты, приносящие менее 20% доходов',
          type: 'bar',
          stack: 'clients',
          data: purpleSeriesData,
          barWidth: '90%',
        },
        {
          name: 'Доля доходов с накопительным итогом, %',
          type: 'line',
          yAxisIndex: 1,
          data: lineData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#6366f1', width: 2 },
          itemStyle: { color: '#6366f1' },
        },
      ],
    }
  }, [chartData])

  return (
    <div className="h-full flex flex-col relative">
      {/* Header with method toggle */}
      <div className="flex items-center gap-10 mb-4 border-b py-5">
        <h3 className="text-sm font-medium text-slate-700">
          Самые доходные клиенты,
          <span className="ml-1 text-slate-500" suppressHydrationWarning>{appStore.currency?.name || '₽'}</span>
        </h3>

        <div className="items-center rounded-md">
          <button type="button" onClick={() => setState('profitableclientsMethod', 'cash')} id="income_expenses" className={`text-neutral-700 border rounded-l-md cursor-pointer text-sm p-2  w-44 ${profitableclientsMethod === 'cash' ? 'border-primary rounded-l-md ' : ''}`}>Метод начисления</button>
          <button type="button" onClick={() => setState('profitableclientsMethod', 'accural')} id="receipts_payments" className={`text-neutral-700 border rounded-r-md cursor-pointer text-sm p-2  w-44 ${profitableclientsMethod === 'accural' ? 'border-primary rounded-r-md ' : ''}`}>Кассовый метод</button>
        </div>
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
              style={{ height: '500px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          )}
        </div>
      </div>
    </div>
  )
})

export default ProfitableClients

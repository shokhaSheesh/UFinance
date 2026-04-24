'use client'

import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { observer } from 'mobx-react-lite'
import { useMemo, useRef, useState } from 'react'
import { apiClient } from '../../../lib/api/ucode/base'
import { appStore } from '../../../store/app.store'
import { indicators } from '../../../store/indicatos.store'

const formatValue = (val) => {
  if (!val && val !== 0) return '0'
  const abs = Math.abs(val)
  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(1)} млрд`
  if (abs >= 1_000_000) return `${(Math.round(abs / 1_000_000)).toLocaleString('ru-RU')} млн`
  return abs.toLocaleString('ru-RU')
}

const ProfitableClients = () => {
  const chartRef = useRef(null)
  const [method, setMethod] = useState(indicators.profitableclientsMethod || 'accrual')

  const profitableFilter = indicators

  const filterData = useMemo(() => ({
    period_from: profitableFilter.rangeMonth?.start,
    period_to: profitableFilter.rangeMonth?.end,
    period_type: profitableFilter.periodType,
    accounting: method,
    deals: profitableFilter.deals?.map(String),
    accounts: profitableFilter.accounts?.map(String),
  }), [profitableFilter, method])

  const { data: profitableClientsData, isLoading } = useQuery({
    queryKey: ['profitable_clients', filterData],
    queryFn: () => apiClient.invokeFunction({ method: 'report_counterparties_financials', data: filterData }),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  const chartData = useMemo(() => {
    if (!profitableClientsData) return null

    const counterparties80 = profitableClientsData.counterparties80 || []
    const counterparties20 = profitableClientsData.counterparties20

    const names = counterparties80.map(c => c.name)
    const barData = counterparties80.map(c => c.summa)
    const lineData = counterparties80.map(c => c.percent_sum)

    // Add the <20% clients as the last bar
    if (counterparties20) {
      names.push('Остальные')
      barData.push(counterparties20.summa)
      lineData.push(100) // Cumulative reaches 100%
    }

    return { names, barData, lineData, counterparties80, counterparties20 }
  }, [profitableClientsData])

  const option = useMemo(() => {
    if (!chartData) return {}

    const { names, barData, lineData } = chartData

    // Separate bar data: blue for 80% (first items), purple for 20% (last item)
    const blueBars = barData.slice(0, -1).map(val => val)
    const purpleBar = barData.slice(-1)[0]

    // Create series data with colors and percent
    const counterparties80Data = chartData.counterparties80 || []
    const barSeriesData = blueBars.map((val, idx) => ({
      value: val,
      percent: counterparties80Data[idx]?.percent,
      itemStyle: { color: '#22c5fd' }
    }))
    if (purpleBar !== undefined) {
      barSeriesData.push({
        value: purpleBar,
        percent: chartData.counterparties20?.percent,
        itemStyle: { color: '#a855f7' }
      })
    }

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        formatter: (params) => {
          const name = params.axisValue || params.name
          const value = params.value
          const percent = params.data?.percent || chartData?.counterparties80?.[params.dataIndex]?.percent

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
          'Клиенты, приносящие более 80% доходов',
          'Клиенты, приносящие менее 20% доходов',
          'Доля доходов с накопительным итогом, %'
        ],
        bottom: 0,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 16 }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          interval: 0,
          rotate: 30,
          fontSize: 16,
          color: '#64748b'
        },
        axisLine: { lineStyle: { color: '#e2e8f0' } }
      },
      yAxis: [
        {
          type: 'value',
          position: 'left',
          axisLabel: {
            formatter: (val) => formatValue(val),
            color: '#64748b',
            fontSize: 16
          },
          splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        {
          type: 'value',
          position: 'right',
          min: 0,
          max: 100,
          axisLabel: {
            formatter: '{value}%',
            color: '#64748b',
            fontSize: 18
          },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'Клиенты, приносящие более 80% доходов',
          type: 'bar',
          data: barSeriesData.slice(0, -1),
          barWidth: '60%'
        },
        {
          name: 'Клиенты, приносящие менее 20% доходов',
          type: 'bar',
          data: barSeriesData.slice(-1),
          barWidth: '60%'
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
          itemStyle: { color: '#6366f1' }
        }
      ]
    }
  }, [chartData])

  const handleMethodChange = (newMethod) => {
    setMethod(newMethod)
    indicators.profitableclientsMethod = newMethod
  }

  // Stats summary
  const stats = useMemo(() => {
    if (!chartData) return null
    const { counterparties80, counterparties20 } = chartData
    const total80 = counterparties80?.reduce((sum, c) => sum + (c.summa || 0), 0) || 0
    const total20 = counterparties20?.summa || 0
    const total = total80 + total20

    return {
      total80,
      total20,
      total,
      count80: counterparties80?.length || 0,
      percent80: counterparties80?.[counterparties80.length - 1]?.percent_sum || 0,
      percent20: counterparties20?.percent || 0
    }
  }, [chartData])

  return (
    <div className="h-full flex flex-col">
      {/* Header with method toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-700">
          Самые доходные клиенты,
          <span className="ml-1 text-slate-500" suppressHydrationWarning>{appStore.currency?.name || '₽'}</span>
        </h3>
        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            onClick={() => handleMethodChange('accrual')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${method === 'accrual'
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Метод начисления
          </button>
          <button
            onClick={() => handleMethodChange('cash')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${method === 'cash'
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Кассовый метод
          </button>
        </div>
      </div>

      {/* Stats summary */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">Клиентов (80% дохода)</div>
            <div className="text-lg font-semibold text-slate-800">{stats.count80}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">Остальные клиенты</div>
            <div className="text-lg font-semibold text-slate-800">{formatValue(stats.total20)}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">Общий доход</div>
            <div className="text-lg font-semibold text-slate-800">{formatValue(stats.total)}</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="flex-1 min-h-0 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
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
  )
}

export default observer(ProfitableClients)

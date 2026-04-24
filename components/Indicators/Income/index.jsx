"use client"

import { cn } from '@/app/lib/utils'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { HelpCircle } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useMemo, useRef, useState } from 'react'
import { GlobalCurrency } from '../../../constants/globalCurrency'
import { apiClient } from '../../../lib/api/ucode/base'
import { indicators } from '../../../store/indicatos.store'
import { formatNumber, formatTotalSumma } from '../../../utils/helpers'
import CustomMonthSlider from '../shared/CustomMonthSlider'

const findRowById = (rows, id) => (rows || []).find((r) => r?.id === id)

const Income = observer(() => {
  const chartRef = useRef(null)
  const [zoomRange, setZoomRange] = useState([0, 100])

  const filterData = {
    periodStartDate: moment(indicators.rangeMonth.start).format('YYYY-MM-DD'),
    periodEndDate: moment(indicators.rangeMonth.end).format('YYYY-MM-DD'),
    periodType: indicators.periodType,
    userCurrencyCode: GlobalCurrency.code,
    accounting_method: indicators.accounting,
    isEbitda: false,
    isEbit: false,
    isEbt: false,
    limit: 100,
    page: 1,
  }

  const { data: profitAndLossDataList, isLoading: profitAndLossLoading } = useQuery({
    queryKey: ['profit_and_loss_income', filterData],
    queryFn: () => apiClient.invokeFunction({ method: 'profit_and_loss', data: filterData }),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  const { months, incomeData, expenseData } = useMemo(() => {
    const legend = profitAndLossDataList?.legend || []
    const rows = profitAndLossDataList?.rows || []

    const keys = legend.map((l) => l?.key).filter(Boolean)
    const titles = legend.map((l) => l?.title || l?.key || '')

    const revenueRow = findRowById(rows, 'revenue')
    const expensesRow = findRowById(rows, 'expenses')

    const readValues = (row) => {
      const src = row?.values || row?.months || {}
      return keys.map((k) => Number(src?.[k] ?? 0))
    }

    return {
      months: titles,
      incomeData: readValues(revenueRow),
      expenseData: readValues(expensesRow),
    }
  }, [profitAndLossDataList])

  const stats = useMemo(() => {
    const revenueTotal = incomeData.reduce((a, b) => a + b, 0)
    const expenseTotal = expenseData.reduce((a, b) => a + b, 0)

    return {
      income: { label: 'Доходы', value: formatNumber(formatTotalSumma(revenueTotal)), plan: '0', color: 'text-slate-900', planColor: 'text-blue-500' },
      expense: { label: 'Расходы', value: formatNumber(formatTotalSumma(expenseTotal)), plan: '0', color: 'text-slate-900', planColor: 'text-blue-500' },
    }
  }, [incomeData, expenseData])

  const donutOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      confine: false,
      appendToBody: true,
      textStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        name: 'Income Breakdown',
        type: 'pie',
        radius: ['60%', '88%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 0,
          borderColor: '#fff',
          borderWidth: 1
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: false
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: Number(stats.income.value.replace(/\s/g, '')) || 250, name: 'Доходы', itemStyle: { color: '#3b82f6', z: 10000 } }
        ],

      }
    ],
    graphic: [{
      type: 'text',
      left: 'center',
      top: 'center',
      style: {
        text: `Доходы:\n${stats.income.value}`,
        textAlign: 'center',
        fill: '#111827',
        fontSize: 18,
        fontWeight: 'bold',
        lineHeight: 34
      }
    }]
  }), [stats])

  const barOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#111827', fontSize: 12 },
      formatter: (params) => {
        let res = `<div class="p-1 font-semibold border-b border-gray-100 mb-1">${params[0].name}</div>`
        params.forEach(item => {
          res += `<div class="flex items-center justify-between gap-4 py-0.5">
                    <div class="flex items-center gap-2 text-gray-500">
                      <span class="w-2 h-2 rounded-full" style="background-color: ${item.color}"></span>
                      ${item.seriesName}
                    </div>
                    <div class="font-medium text-slate-900">${Number(item.value ?? 0).toLocaleString('ru-RU')} $</div>
                  </div>`
        })
        return res
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '5%',
      top: '10%',
      containLabel: true
    },
    dataZoom: [{
      type: 'slider',
      show: false,
      start: zoomRange[0],
      end: zoomRange[1],
    }],
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { show: true, lineStyle: { color: '#e5e7eb' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#111827',
        fontSize: 12,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: {
        color: '#111827',
        fontSize: 12,
        formatter: (value) => {
          if (value === 0) return '0'
          const abs = Math.abs(value)
          if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} млрд`
          if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} млн`
          if (abs >= 1_000) return `${(value / 1_000).toFixed(0)} тыс`
          return `${value}`
        }
      }
    },
    series: [
      {
        name: 'Доходы',
        type: 'bar',
        data: incomeData,
        barWidth: 30,
        borderRadius: [4, 4, 0, 0],
        itemStyle: { color: '#3b82f6' }
      }
    ]
  }), [zoomRange, months, incomeData])

  return (
    <div className="w-full p-6 rounded-lg mt-6 relative">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[14px] font-medium text-[#111827]">Доходы, $</h2>
        <div className="flex items-center justify-center size-4 bg-neutral-100 rounded-full cursor-help">
          <HelpCircle className="size-2.5 text-neutral-400" />
        </div>
      </div>
      <div className="w-full h-px bg-neutral-100 mb-8" />

      {/* Loading Overlay */}
      {profitAndLossLoading && (
        <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-neutral-200 border-t-[#0E73F6] rounded-full animate-spin" />
            <span className="text-sm text-neutral-600">Загрузка...</span>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Donut Pane */}
        <div className="w-full lg:w-[600px] shrink-0 flex items-center justify-between relative z-10">
          <div className=" relative shrink-0">
            <ReactECharts
              option={donutOption}
              style={{ height: '300px', width: '300px' }}
            />
          </div>
          <div className="flex-1 pl-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 bg-blue-500 rounded-sm"></div>
                <span className="text-xx text-gray-600">{stats.income.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-xx font-bold", stats.income.color)}>{stats.income.value}</span>
                <span className="text-xx text-gray-400" suppressHydrationWarning>{GlobalCurrency.name}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 bg-orange-400 rounded-sm"></div>
                <span className="text-xx text-gray-600">{stats.expense.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-xx font-bold", stats.expense.color)}>{stats.expense.value}</span>
                <span className="text-xx text-gray-400" suppressHydrationWarning>{GlobalCurrency.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart Pane */}
        <div className="flex-1">
          <div className="mb-4 px-2">
            <CustomMonthSlider
              value={zoomRange}
              onChange={setZoomRange}
            />
          </div>
          <div className="h-[300px] w-full">
            <ReactECharts
              ref={chartRef}
              option={barOption}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
})

export default Income
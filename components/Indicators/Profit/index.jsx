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

const Profit = observer(() => {
  const chartRef = useRef(null);
  const [zoomRange, setZoomRange] = useState([0, 50]); // [start, end] percentage

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
    queryKey: ["profit_and_loss", filterData],
    queryFn: () => apiClient.invokeFunction({ method: "profit_and_loss", data: filterData }),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,  // tab o'zgarganda OFF
    refetchOnMount: true,          // page ga qaytganda ON ✅
  })

  const { months, incomeData, expenseData, netProfitData, dividendData } = useMemo(() => {
    const legend = profitAndLossDataList?.legend || []
    const rows = profitAndLossDataList?.rows || []

    const keys = legend.map((l) => l?.key).filter(Boolean)
    const titles = legend.map((l) => l?.title || l?.key || '')

    const revenueRow = findRowById(rows, 'revenue')
    const expensesRow = findRowById(rows, 'expenses')
    const netProfitRow = findRowById(rows, 'net-profit')
    const dividendsRow = findRowById(rows, 'dividends')

    const readValues = (row) => {
      const src = row?.values || row?.months || {}
      return keys.map((k) => Number(src?.[k] ?? 0))
    }

    return {
      months: titles,
      incomeData: readValues(revenueRow),
      expenseData: readValues(expensesRow),
      netProfitData: readValues(netProfitRow),
      dividendData: readValues(dividendsRow),
    }
  }, [profitAndLossDataList])

  const stats = useMemo(() => {
    const revenueTotal = incomeData.reduce((a, b) => a + b, 0)
    const expenseTotal = expenseData.reduce((a, b) => a + b, 0)
    const netProfitTotal = profitAndLossDataList?.netProfit ?? (revenueTotal - expenseTotal)
    const dividendTotal = dividendData.reduce((a, b) => a + b, 0)
    const margin = revenueTotal ? (netProfitTotal / revenueTotal) * 100 : 0

    return [
      { label: 'Доходы', value: formatNumber(formatTotalSumma(revenueTotal)), plan: '0', color: 'text-slate-900', planColor: 'text-blue-500' },
      { label: 'Расходы', value: formatNumber(formatTotalSumma(expenseTotal)), plan: '0', color: 'text-slate-900', planColor: 'text-blue-500' },
      { label: 'Чистая прибыль', value: formatNumber(formatTotalSumma(netProfitTotal)), plan: '0', color: 'text-slate-900', planColor: 'text-blue-500' },
      { label: 'Рентабельность, %', value: `${formatNumber(margin)}%`, plan: '0%', color: 'text-slate-900', planColor: 'text-blue-500' },
      { label: 'Дивиденды', value: formatNumber(formatTotalSumma(dividendTotal)), plan: '0', color: 'text-slate-900', planColor: 'text-blue-500' },
    ]
  }, [incomeData, expenseData, dividendData, profitAndLossDataList])

  const options = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#111827', fontSize: 12 },
      shadowColor: 'rgba(255 26 26 / 0.1)',
      shadowBlur: 10,
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
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { color: '#6b7280', fontSize: 12 },
      data: ['Доходы', 'Расходы', 'Чистая прибыль', 'Дивиденды']
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
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 11, interval: 0 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
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
        barWidth: 20,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: '#38bdf8'
        }
      },
      {
        name: 'Расходы',
        type: 'bar',
        data: expenseData,
        barWidth: 20,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: '#fbab7e'
        }
      },
      {
        name: 'Чистая прибыль',
        type: 'line',
        data: netProfitData,
        smooth: true,
        showSymbol: true,
        symbolSize: 8,
        lineStyle: { width: 3, color: '#10b981', type: 'dashed' },
        itemStyle: { color: '#10b981', borderWidth: 2, borderColor: '#fff' }
      },
      {
        name: 'Дивиденды',
        type: 'line',
        data: dividendData,
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: { width: 2, color: '#c084fc' },
        itemStyle: { color: '#920DF8', borderWidth: 2, borderColor: '#fff' }
      }
    ]
  }), [zoomRange, months, incomeData, expenseData, netProfitData, dividendData])


  return (
    <div className="w-full bg-white p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <h2 className="text-[22px] font-bold text-[#111827]">Прибыль, $</h2>
          <div className="flex items-center justify-center size-5 bg-neutral-100 rounded-full cursor-help">
            <HelpCircle className="size-3 text-neutral-400" />
          </div>
        </div>
        <div className="flex bg-[#f3f4f624] border border-neutral-200 rounded-md p-[3px]">
          <button className="px-4 py-1.5 text-sm font-medium text-neutral-500 hover:text-slate-900 rounded transition-colors whitespace-nowrap">
            Метод начисления
          </button>
          <button className="px-4 py-1.5 text-sm font-medium bg-white text-[#38bdf8] shadow-sm border border-neutral-200 rounded transition-colors whitespace-nowrap">
            Кассовый метод
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 overflow-auto relative">
        {/* Loading Overlay */}
        {profitAndLossLoading && (
          <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-neutral-200 border-t-[#0E73F6] rounded-full animate-spin" />
              <span className="text-sm text-neutral-600">Загрузка...</span>
            </div>
          </div>
        )}

        {/* Statistics panel */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-7 pr-4 mt-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center justify-between group">
              <span className="text-[14px] font-medium text-neutral-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">
                {stat.label}
              </span>
              <div className="flex flex-col items-end">
                <span className={cn("text-base font-bold leading-none mb-1", stat.color)}>
                  {stat.value}
                </span>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className={cn("font-semibold", stat.planColor)}>{stat.plan}</span>
                  <span className="text-neutral-400">— по плану</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart container */}
        <div className="flex-1">
          <div className="mb-4 pt-4 px-2">
            <CustomMonthSlider
              value={zoomRange}
              onChange={setZoomRange}
            />
          </div>
          <div className="h-[450px] w-full">
            <ReactECharts
              ref={chartRef}
              option={options}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
})

export default Profit
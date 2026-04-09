"use client"

import { cn } from '@/app/lib/utils'
import ReactECharts from 'echarts-for-react'
import { HelpCircle } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import CustomMonthSlider from '../shared/CustomMonthSlider'

// Static Mock Data based on the provided image
const months = ['янв', 'фев', 'мар', 'апр', 'апр\n(план)', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const incomeData = [20000, 25000, 22000, 30000, 50000, 35000, 38000, 42000, 40000, 45000, 48000, 52000, 55000]
const expenseData = [15000, 18000, 16000, 20000, 5000, 25000, 26000, 28000, 27000, 30000, 32000, 35000, 38000]
const netProfitData = incomeData.map((val, idx) => val - expenseData[idx])
const dividendData = [0, 0, 0, 0, 0, 5000, 0, 0, 0, 0, 0, 0, 10000]

const Profit = () => {
  const chartRef = useRef(null);
  const [zoomRange, setZoomRange] = useState([0, 50]); // [start, end] percentage

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
                    <div class="font-medium text-slate-900">${item.value.toLocaleString('ru-RU')} $</div>
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
      max: 60000,
      interval: 10000,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
        formatter: (value) => value === 0 ? '0' : `${value / 1000} тыс`
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
          color: '#38bdf8' // Cyan-blue
        },
        // Special highlighting for "Apr (plan)"
        markArea: {
          data: [[{
            xAxis: 'апр\n(план)',
            itemStyle: { color: 'rgba(56, 189, 248, 0.1)' }
          }, {
            xAxis: 'апр\n(план)'
          }]]
        }
      },
      {
        name: 'Расходы',
        type: 'bar',
        data: expenseData,
        barWidth: 20,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: '#fbab7e' // Orange
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
  }), [zoomRange])

  const stats = [
    { label: 'Доходы', value: '100', plan: '50 793', color: 'text-slate-900', planColor: 'text-blue-500' },
    { label: 'Расходы', value: '40', plan: '180', color: 'text-slate-900', planColor: 'text-blue-500' },
    { label: 'Чистая прибыль', value: '60', plan: '50 613', color: 'text-slate-900', planColor: 'text-blue-500' },
    { label: 'Рентабельность, %', value: '60%', plan: '99.65%', color: 'text-slate-900', planColor: 'text-blue-500' },
    { label: 'Дивиденды', value: '0', plan: '0', color: 'text-slate-900', planColor: 'text-blue-500' },
  ]

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

      <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto">
        {/* Statistics panel */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-7 pr-4 mt-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center justify-between group">
              <span className="text-[14px] font-medium text-neutral-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">
                {stat.label}
              </span>
              <div className="flex flex-col items-end">
                <span className={cn("text-[28px] font-bold leading-none mb-1", stat.color)}>
                  {stat.value}
                </span>
                <div className="flex items-center gap-1.5 text-[13px]">
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
}

export default Profit
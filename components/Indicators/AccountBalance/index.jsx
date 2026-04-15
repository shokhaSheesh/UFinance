"use client"

import ReactECharts from 'echarts-for-react'
import { HelpCircle } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import CustomMonthSlider from '../shared/CustomMonthSlider'

// Mock Data for Step Chart
const generateDateRange = () => {
    const dates = []
    const baseDate = new Date(2026, 0, 1)
    for (let i = 0; i < 365; i++) {
        const d = new Date(baseDate)
        d.setDate(baseDate.getDate() + i)
        const day = d.getDate().toString().padStart(2, '0')
        const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
        const month = monthNames[d.getMonth()]
        const year = d.getFullYear().toString().slice(-2)
        dates.push(`${day} ${month} ${year}`)
    }
    return dates
}

const dates = generateDateRange()
const balanceData = new Array(365).fill(0).map((_, i) => {
    if (i < 90) return 0
    if (i < 100) return 40
    if (i < 110) return 210
    return 105
})

const AccountBalance = () => {
    const chartRef = useRef(null)
    const [zoomRange, setZoomRange] = useState([20, 60]) // Focused on Apr/May for visual impact

    const options = useMemo(() => ({
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
                    <div class="font-medium text-slate-900">${item.value.toLocaleString('ru-RU')} $</div>
                  </div>`
                })
                return res
            }
        },
        grid: {
            left: '2%',
            right: '2%',
            bottom: '10%',
            top: '10%',
            containLabel: true
        },
        legend: {
            bottom: 0,
            left: 'left',
            icon: 'roundRect',
            itemWidth: 14,
            itemHeight: 14,
            textStyle: { color: '#6b7280', fontSize: 11 },
            data: ['Общий остаток', 'Xalq bank [765]', 'kapital bank [765]', 'nhgbhfdv [() ]']
        },
        dataZoom: [{
            type: 'slider',
            show: false,
            start: zoomRange[0],
            end: zoomRange[1],
        }],
        xAxis: {
            type: 'category',
            data: dates,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#9ca3af', fontSize: 10, interval: 30 }
        },
        yAxis: {
            type: 'value',
            max: 250,
            interval: 50,
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: '#f3f4f6' } },
            axisLabel: { color: '#9ca3af', fontSize: 10 }
        },
        series: [
            {
                name: 'Общий остаток',
                type: 'line',
                step: 'end',
                data: balanceData,
                symbol: 'circle',
                symbolSize: 0,
                showSymbol: false,
                lineStyle: { width: 2, color: '#22c55e' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(34, 197, 94, 0.2)' },
                            { offset: 1, color: 'rgba(34, 197, 94, 0.02)' }
                        ]
                    }
                },
                itemStyle: { color: '#22c55e' },
                markLine: {
                    symbol: 'none',
                    data: [{
                        xAxis: dates[105], // Approx "Сегодня" in this mock setup
                        lineStyle: { color: '#3b82f6', type: 'dashed', width: 1 },
                        label: { show: true, formatter: 'Сегодня', position: 'start', color: '#3b82f6', fontSize: 11, fontWeight: 'bold' }
                    }]
                },
                markPoint: {
                    data: [{
                        xAxis: dates[105],
                        yAxis: balanceData[105],
                        symbol: 'circle',
                        symbolSize: 8,
                        itemStyle: { color: '#fff', borderColor: '#22c55e', borderWidth: 2 }
                    }],
                    label: { show: false }
                }
            },
            { name: 'Xalq bank [765]', type: 'line', data: [] },
            { name: 'kapital bank [765]', type: 'line', data: [] },
            { name: 'nhgbhfdv [() ]', type: 'line', data: [] }
        ]
    }), [zoomRange])

    return (
        <div className="w-full bg-white p-6 rounded-lg mt-6 ">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <h2 className="text-[20px] font-bold text-[#111827]">Остатки на счетах, $</h2>
                    <div className="flex items-center justify-center size-5 bg-neutral-100 rounded-full cursor-help">
                        <HelpCircle className="size-3 text-neutral-400" />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="px-2">
                    <CustomMonthSlider 
                        value={zoomRange} 
                        onChange={setZoomRange}
                    />
                </div>
                <div className="h-[400px] w-full">
                    <ReactECharts
                        ref={chartRef}
                        option={options}
                        style={{ height: '100%', width: '100%' }}
                        opts={{ renderer: 'svg' }}
                    />
                </div>
            </div>
        </div>
    )
}

export default AccountBalance
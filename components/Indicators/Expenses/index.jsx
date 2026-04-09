"use client"

import ReactECharts from 'echarts-for-react'
import { HelpCircle } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import CustomMonthSlider from '../shared/CustomMonthSlider'

// Mock Data for Expenses
const months = ['янв', 'фев', 'мар', 'апр\n(факт)', 'апр\n(план)', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
// Stacked data for Apr (fact)
const amortizationData = [0, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0]
const otherExpensesData = [0, 0, 0, 80, 180, 0, 0, 0, 0, 0, 0, 0, 0]

const Expenses = () => {
    const chartRef = useRef(null)
    const [zoomRange, setZoomRange] = useState([0, 100])

    const donutOption = useMemo(() => ({
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        },
        series: [
            {
                name: 'Expense Breakdown',
                type: 'pie',
                radius: ['70%', '98%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 0,
                    borderColor: '#fff',
                    borderWidth: 1
                },
                label: { show: false },
                labelLine: { show: false },
                data: [
                    { value: 100, name: 'Амортизация', itemStyle: { color: '#eab308' } },
                    { value: 80, name: 'Нераспределенный р', itemStyle: { color: '#f97316' } }
                ]
            }
        ],
        graphic: [{
            type: 'text',
            left: 'center',
            top: 'center',
            style: {
                text: 'Расходы:\n180',
                textAlign: 'center',
                fill: '#111827',
                fontSize: 28,
                fontWeight: 'bold',
                lineHeight: 34
            }
        }]
    }), [])

    const barOption = useMemo(() => ({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            textStyle: { color: '#111827', fontSize: 12 },
            formatter: (params) => {
                let res = `<div class="p-1 font-semibold border-b border-gray-100 mb-1">${params[0].name.replace('\n', ' ')}</div>`
                params.forEach(item => {
                    if (item.value === 0) return
                    res += `<div class="flex items-center justify-between gap-4 py-0.5">
                    <div class="flex items-center gap-2 text-gray-500">
                      <span class="w-2 h-2 rounded-full" style="background-color: ${item.color.color || item.color}"></span>
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
                interval: (index, value) => {
                    const shownMonths = ['янв', 'мар', 'апр\n(план)', 'июн', 'авг', 'окт', 'дек']
                    return shownMonths.includes(value)
                }
            }
        },
        yAxis: {
            type: 'value',
            max: 200,
            interval: 20,
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: '#f3f4f6' } },
            axisLabel: { 
                color: '#111827', 
                fontSize: 12,
                formatter: (value) => value === 0 ? '0' : `${value / 1000} тыс`
            }
        },
        series: [
            {
                name: 'Амортизация',
                type: 'bar',
                stack: 'total',
                data: amortizationData.map((val, idx) => {
                    if (months[idx].includes('план')) {
                        return {
                            value: val,
                            itemStyle: {
                                color: 'rgba(234, 179, 8, 0.2)',
                                borderColor: '#eab308',
                                borderType: 'dashed',
                                borderWidth: 1
                            }
                        }
                    }
                    return {
                        value: val,
                        itemStyle: { color: '#eab308' }
                    }
                }),
                barWidth: 30
            },
            {
                name: 'Нераспределенный р',
                type: 'bar',
                stack: 'total',
                data: otherExpensesData.map((val, idx) => {
                    if (months[idx].includes('план')) {
                        return {
                            value: val,
                            itemStyle: {
                                color: 'rgba(249, 115, 22, 0.2)',
                                borderColor: '#f97316',
                                borderType: 'dashed',
                                borderWidth: 1
                            }
                        }
                    }
                    return {
                        value: val,
                        itemStyle: { color: '#f97316' }
                    }
                }),
                barWidth: 30,
                itemStyle: { borderRadius: [4, 4, 0, 0] }
            }
        ]
    }), [zoomRange])

    return (
        <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-neutral-100 mt-6">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[14px] font-medium text-[#111827]">Расходы, $</h2>
                <div className="flex items-center justify-center size-4 bg-neutral-100 rounded-full cursor-help">
                    <HelpCircle className="size-2.5 text-neutral-400" />
                </div>
            </div>
            <div className="w-full h-px bg-neutral-100 mb-8" />

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Donut Pane */}
                <div className="w-full lg:w-[600px] shrink-0 flex items-center justify-between">
                    <div className=" relative shrink-0">
                        <ReactECharts
                            option={donutOption}
                            style={{ height: '300px', width: '300px' }}
                        />
                    </div>
                    <div className="flex-1 pl-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-yellow-500 rounded-sm"></div>
                                <span className="text-xx text-gray-600">Амортизация</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xx font-bold text-gray-900">100</span>
                                <span className="text-xx text-gray-400">(55.56%)</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="size-3 bg-orange-500 rounded-sm"></div>
                                <span className="text-xx text-gray-600">Нераспределенный р</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xx font-bold text-gray-900">80</span>
                                <span className="text-xx text-gray-400">(44.44%)</span>
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
}

export default Expenses
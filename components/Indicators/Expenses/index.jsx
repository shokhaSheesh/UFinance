"use client"

import { cn } from '@/app/lib/utils'
import ReactECharts from 'echarts-for-react'
import { HelpCircle } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useMemo, useRef, useState } from 'react'
import { formatNumber, formatTotalSumma } from '../../../utils/helpers'
import { getRandomColor } from '../../../utils/randomColor'
import { findByName } from '../Income'
import CustomMonthSlider from '../shared/CustomMonthSlider'
import './style.scss'

const findRowById = (rows, id) => (rows || []).find((r) => r?.id === id)
const colors = [
    '#FFA55C',
    '#FFC35C',
    '#FFB129',
    '#FFA200',
    '#FFD48A',
    '#A36700',
    '#754A00',
    '#472D00',
    '#D18400',
    '#FF8929',
    '#FF7300',
    '#D15E00',
    '#A34900',
    '#753500',
    '#472000',
    '#472000',
    '#FFD829',
    '#D1AB00',
    '#FFE15C',
    '#A38500'
]

const mergeValues = (nodes) => {
    const out = {}
    nodes.forEach(node => {
        Object.entries(node?.values || {}).forEach(([month, val]) => {
            out[month] = (out[month] || 0) + Number(val || 0)
        })
    })
    return out
}


const Expenses = observer(({ profitAndLossDataList, isLoading, method, cashFlowDataList }) => {
    const chartRef = useRef(null)
    const [zoomRange, setZoomRange] = useState([0, 100])



    const { months, expenseData, childrens } = useMemo(() => {
        const rows = profitAndLossDataList?.rows || []
        const expensesRow = findRowById(rows, 'expenses')
        const profit = rows.find(item => item?.name === 'Расходы')
        const cashFlowLegend = cashFlowDataList?.legend
        // Pick the right key source per method
        const profitKeys = Object.keys(profit?.months || {})

        const sections = ['Операционный поток', 'Инвестиционный поток', 'Финансовый поток']
        const allIncomeList = cashFlowDataList?.rows?.filter(item => sections.includes(item?.name))
        const income = findByName(allIncomeList, 'Выплаты') || []

        // Union of all month keys across cashflow Выплаты nodes (so no month gets dropped)
        const cashflowKeys = Array.from(
            new Set(income.flatMap(n => Object.keys(n?.values || {})))
        ).sort()

        const activeKeys = method === 'income_expenses' ? profitKeys : cashflowKeys

        const readValues = (row) => {
            const src = row?.values || row?.months || {}
            return activeKeys.map((k) => Number(src?.[k] ?? 0))
        }

        const titles = profitAndLossDataList?.legend.map((item) => item.title)
        const cashTitles = cashFlowLegend?.map((item) => item.title)

        const childrens = method === 'income_expenses'
            ? (profit?.details?.filter(i => i?.total !== 0).map(i => ({ ...i, values: readValues(i) })) || [])
            : (income.filter(i => i?.totalValue !== 0).map(i => ({ ...i, values: readValues(i) })))

        return {
            months: method === 'income_expenses' ? titles : cashTitles,
            expenseData: method === 'income_expenses' ? readValues(expensesRow) : readValues({ values: mergeValues(income) }),
            childrens
        }
    }, [profitAndLossDataList, cashFlowDataList, method])

    const stats = useMemo(() => {
        const expenseTotal = expenseData?.reduce((a, b) => a + b, 0)

        const details = childrens?.map((item, index) => {
            const color = colors[index]
            return {
                values: item?.values,
                id: item?.id,
                label: item?.name,
                value: formatNumber(formatTotalSumma(item.values.reduce((a, b) => a + b, 0), 0))?.replace(/\-/g, ''),
                color: color,
                planColor: color
            }
        }) || []

        return {
            expense: { label: method === 'income_expenses' ? 'Выплаты' : 'Расходы', value: formatNumber(formatTotalSumma(expenseTotal, 0))?.replace(/\-/g, ''), plan: '0', color: 'text-slate-900', planColor: 'text-blue-500' },
            details
        }
    }, [expenseData, childrens, method])

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
                name: 'Expense Breakdown',
                type: 'pie',
                radius: ['50%', '90%'],
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
                data: stats?.details?.map(item => ({ value: Number(item.value.replace(/[\s.-]/g, ''))?.toFixed(0) || 250, name: item.label, itemStyle: { color: item.color, z: 10000 } })),

            }
        ],
        graphic: [{
            type: 'text',
            left: 'center',
            top: 'center',
            style: {
                text: `${stats.expense.label}\n${stats.expense.value}`,
                textAlign: 'center',
                fill: '#111827',
                fontSize: 20,
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
                    return `${formatTotalSumma(value, 0)}`
                }
            }
        },
        series: stats?.details?.map((child, index) => ({
            name: child?.label,
            type: 'bar',
            stack: 'total',
            stackStrategy: 'samesign',
            data: child?.values.map((value) => ({ value: Number(formatTotalSumma(value, 0)?.replace(/\-/, '')) })),
            barWidth: 30,
            itemStyle: {
                color: stats?.details?.[index]?.color || getRandomColor('#D69B42'),
                borderColor: '#fff',
                borderWidth: 1
            }
        })) || []
    }), [zoomRange, months, stats])


    return (
        <div className="w-full bg-white p-6 rounded-lg  mt-6">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[14px] font-medium text-[#111827]">Расходы, $</h2>
                <div className="flex items-center justify-center size-4 bg-neutral-100 rounded-full cursor-help">
                    <HelpCircle className="size-2.5 text-neutral-400" />
                </div>
            </div>
            <div className="w-full h-px bg-neutral-100 mb-8" />

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Donut Pane */}
                <div className="w-full flex-1 shrink-0 flex items-center justify-between relative z-10">
                    <div className="relative shrink-0 overflow-visible">
                        <ReactECharts
                            option={donutOption}
                            style={{ height: '300px', width: '300px' }}
                        />
                    </div>
                    <div className="flex-1 pl-6 space-y-4">
                        {stats?.details?.map(item => (
                            <div key={item?.id} className="flex items-center gap-5">
                                <div className="flex items-center gap-2">
                                    <div className="size-3" style={{ backgroundColor: item?.color }}></div>
                                    <span className="text-sm text-gray-600">{item?.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-xx font-bold", item?.color)}>{item?.value}</span>
                                    <span className="text-sm text-gray-400" suppressHydrationWarning></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bar Chart Pane */}
                <div className="flex-1 relative z-10">
                    <div className="mb-4 px-2">
                        <CustomMonthSlider
                            value={zoomRange}
                            onChange={setZoomRange}
                        />
                    </div>
                    <div className="h-[300px] w-full overflow-visible">
                        <ReactECharts
                            ref={chartRef}
                            option={barOption}
                            style={{ height: '100%', width: 'fit' }}
                            opts={{ renderer: 'svg' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
})

export default Expenses
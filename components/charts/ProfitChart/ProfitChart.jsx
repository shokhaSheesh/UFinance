"use client"

import { monthlyData } from '@/app/lib/mock-data'
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import styles from './ProfitChart.module.scss'

export function ProfitChart() {
    return (
        <div className={styles.container}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#6b7280' }}
                    />
                    <Bar dataKey="income" name="Доходы" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="expense" name="Расходы" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
                    <Line
                        type="monotone"
                        dataKey="profit"
                        name="Прибыль"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
}

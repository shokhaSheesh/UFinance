'use client'

import { formatAmount } from '@/utils/helpers'
import { ChevronDown } from 'lucide-react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const fmtMoney = (v, symbol) => `${formatAmount(v || 0)} ${symbol}`
const fmtPercent = (v) => (v == null ? '—' : `${Number(v).toFixed(1)}%`)

// Метрика: крупное фактическое значение + значение ниже
const Metric = ({ label, fact, plan }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[11px] font-semibold tracking-wide text-neutral-400 uppercase">{label}</span>
    <span className="text-3xl font-bold text-slate-900 leading-none">{fact}</span>
    <span className="text-xs text-neutral-400">{plan}</span>
  </div>
)

// Метрика с цветной полосой
const MetricBar = ({ label, fact, plan, color }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[11px] font-semibold tracking-wide text-neutral-400 uppercase">{label}</span>
    <span className="text-2xl font-bold text-slate-900 leading-none">{fact}</span>
    <div className="h-6 rounded-md relative overflow-hidden" style={{ backgroundColor: `${color}22` }}>
      <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-medium" style={{ color }}>
        {plan}
      </span>
    </div>
  </div>
)

export default function ProjectSummaryCards({ td, plan, chartData, symbol, loading }) {
  const hasChart = Array.isArray(chartData) && chartData.length > 0

  return (
    <div className="grid grid-cols-3 gap-4 px-6 py-4">
      {/* Прибыль + рентабельность */}
      <div className="border border-neutral-200 rounded-xl p-5 flex flex-col gap-6">
        <Metric
          label={td('profit')}
          fact={fmtMoney(plan.profit.fact, symbol)}
          plan={fmtMoney(plan.profit.plan, symbol)}
        />
        <Metric
          label={td('profitability')}
          fact={fmtPercent(plan.profitability.fact)}
          plan={fmtPercent(plan.profitability.plan)}
        />
      </div>

      {/* Доходы + расходы + график */}
      <div className="col-span-2 border border-neutral-200 rounded-xl p-5">
        <div className="flex gap-8">
          <div className="flex flex-col gap-5 w-56 shrink-0">
            <MetricBar
              label={td('income')}
              fact={fmtMoney(plan.income.fact, symbol)}
              plan={fmtMoney(plan.income.plan, symbol)}
              color="#2f6bff"
            />
            <MetricBar
              label={td('expenses')}
              fact={fmtMoney(plan.expenses.fact, symbol)}
              plan={fmtMoney(plan.expenses.plan, symbol)}
              color="#f59e0b"
            />
          </div>

          {/* График «по месяцам»: доходы/расходы (столбцы) + прибыль (линия) */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                className="flex items-center gap-1 text-primary text-xs font-semibold uppercase tracking-wide cursor-pointer"
              >
                {td('byMonths')}
                <ChevronDown size={14} />
              </button>
            </div>
            <div className="h-44">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-neutral-300 text-xs">…</div>
              ) : hasChart ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barGap={2}>
                    <CartesianGrid vertical={false} stroke="#f1f3f8" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#98a2b3' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={48}
                      tick={{ fontSize: 11, fill: '#98a2b3' }}
                      tickFormatter={(v) => formatAmount(v)}
                    />
                    <Tooltip
                      formatter={(value, name) => [`${formatAmount(value)} ${symbol}`, td(name)]}
                      labelStyle={{ fontSize: 12 }}
                      contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e3e6ec' }}
                    />
                    <Bar dataKey="income" name="income" fill="#2f6bff" radius={[3, 3, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="expenses" name="expenses" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={22} />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      name="profit"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#ef4444' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-300 text-xs">
                  {td('noChartData')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

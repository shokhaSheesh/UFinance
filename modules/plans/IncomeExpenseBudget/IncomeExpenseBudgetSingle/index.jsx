'use client'

import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { Building2, Download, Minus, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

const PERIOD_KEYS = [
  { key: 'total', isTotal: true },
  { key: '2025-11' },
  { key: '2025-12' },
  { key: '2026-01' },
  { key: '2026-02' },
  { key: '2026-03' },
  { key: '2026-04' },
  { key: '2026-05' },
  { key: '2026-06' },
  { key: '2026-07' },
  { key: '2026-08' },
  { key: '2026-09' }
]

const PERIODS = PERIOD_KEYS

const COLUMN_DEFS = [
  { key: 'plan', alwaysOn: true },
  { key: 'fact' },
  { key: 'planExec' },
  { key: 'deviation' },
  { key: 'deviationPct' }
]

const v = (plan, fact) => ({ plan, fact })
const zero = () => ({ plan: 0, fact: 0 })
const zeroPeriods = () => PERIODS.reduce((acc, p) => ({ ...acc, [p.key]: zero() }), {})

const STRUCTURE = [
  {
    id: 'income',
    labelKey: 'rows.income',
    kind: 'section',
    children: [
      {
        id: 'undistributed',
        labelKey: 'rows.undistributedIncome',
        kind: 'category',
        values: zeroPeriods()
      },
      {
        id: 'other-income',
        labelKey: 'rows.otherIncome',
        kind: 'category',
        children: [],
        values: zeroPeriods()
      },
      {
        id: 'repair-services',
        labelKey: 'rows.repairServices',
        kind: 'category',
        values: {
          total: v(2150000, 1650000),
          '2025-11': v(300000, 300000),
          '2025-12': v(500000, 500000),
          '2026-01': v(500000, 500000),
          '2026-02': v(600000, 350000),
          '2026-03': v(250000, 0),
          '2026-04': v(0, 0),
          '2026-05': v(0, 0),
          '2026-06': v(0, 0),
          '2026-07': v(0, 0),
          '2026-08': v(0, 0),
          '2026-09': v(0, 0)
        }
      },
      {
        id: 'client-income',
        labelKey: 'rows.clientIncome',
        kind: 'category',
        values: zeroPeriods()
      }
    ]
  },
  {
    id: 'expense',
    labelKey: 'rows.expense',
    kind: 'section',
    children: [
      {
        id: 'staff-costs',
        labelKey: 'rows.staffCosts',
        kind: 'category',
        values: {
          total: v(540000, 380000),
          '2025-11': v(0, 0),
          '2025-12': v(200000, 200000),
          '2026-01': v(100000, 100000),
          '2026-02': v(20000, 20000),
          '2026-03': v(150000, 0),
          '2026-04': v(20000, 0),
          '2026-05': v(0, 0),
          '2026-06': v(0, 0),
          '2026-07': v(0, 0),
          '2026-08': v(0, 0),
          '2026-09': v(50000, 60000)
        }
      },
      {
        id: 'rent-costs',
        labelKey: 'rows.rentCosts',
        kind: 'category',
        values: {
          total: v(263360, 153239),
          '2025-11': v(0, 0),
          '2025-12': v(121104, 121104),
          '2026-01': v(27313, 27313),
          '2026-02': v(7410, 7410),
          '2026-03': v(67077, 0),
          '2026-04': v(7412, 0),
          '2026-05': v(0, 0),
          '2026-06': v(0, 0),
          '2026-07': v(0, 0),
          '2026-08': v(0, 0),
          '2026-09': v(33044, 0)
        }
      },
      {
        id: 'other-costs',
        labelKey: 'rows.otherCosts',
        kind: 'category',
        children: [],
        values: {
          total: v(95000, 40000),
          '2025-11': v(0, 0),
          '2025-12': v(50000, 50000),
          '2026-01': v(10000, 10000),
          '2026-02': v(5000, 5000),
          '2026-03': v(17500, 0),
          '2026-04': v(5000, 0),
          '2026-05': v(0, 0),
          '2026-06': v(0, 0),
          '2026-07': v(0, 0),
          '2026-08': v(0, 0),
          '2026-09': v(7500, 0)
        }
      }
    ]
  }
]

const formatNum = (n, { showSign = false } = {}) => {
  if (n === 0 || n == null || Number.isNaN(n)) return '0'
  const rounded = Math.round(n)
  const abs = Math.abs(rounded)
  const formatted = new Intl.NumberFormat('ru-RU').format(abs).replace(/ /g, ' ')
  if (rounded < 0) return `−${formatted}`
  return showSign ? `+${formatted}` : formatted
}

const formatPlanExec = (n) => `${Math.round(n)}%`

const formatPct = (n) => {
  if (n == null || !Number.isFinite(n)) return '—'
  const rounded = (Math.round(n * 100) / 100).toFixed(2).replace(/\.?0+$/, '')
  return `${rounded}%`
}

const formatDeviationPct = (n) => {
  const rounded = Math.round(n)
  if (rounded === 0) return '0%'
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)}%`
}

const computeMetrics = ({ plan, fact }) => {
  const deviation = fact - plan
  const planExec = plan === 0 ? null : (fact / plan) * 100
  const deviationPct = plan === 0 ? null : (deviation / Math.abs(plan)) * 100
  return { plan, fact, deviation, planExec, deviationPct }
}

const sumValues = (a, b) => ({ plan: (a.plan || 0) + (b.plan || 0), fact: (a.fact || 0) + (b.fact || 0) })

const aggregateNode = (node) => {
  if (node.kind === 'category') {
    return PERIODS.reduce((acc, p) => {
      acc[p.key] = node.values[p.key] || zero()
      return acc
    }, {})
  }
  const childAggs = node.children.map(aggregateNode)
  return PERIODS.reduce((acc, p) => {
    acc[p.key] = childAggs.reduce((s, c) => sumValues(s, c[p.key]), zero())
    return acc
  }, {})
}

const IncomeExpenseBudgetSingle = () => {
  const router = useRouter()
  const t = useTranslations('Plans.IncomeExpenseBudgetSingle')

  const periods = useMemo(
    () =>
      PERIODS.map((p) => {
        if (p.isTotal) return { ...p, label: t('periodTotal') }
        const [year, month] = p.key.split('-')
        return { ...p, label: `${t(`months.${parseInt(month, 10)}`)}' ${year.slice(2)}` }
      }),
    [t]
  )

  const groupingOptions = useMemo(
    () => [
      { value: 'months', label: t('grouping.months') },
      { value: 'quarters', label: t('grouping.quarters') },
      { value: 'years', label: t('grouping.years') }
    ],
    [t]
  )

  const methodOptions = useMemo(
    () => [
      { value: 'cash', label: t('method.cash') },
      { value: 'accrual', label: t('method.accrual') }
    ],
    [t]
  )

  const indicatorOptions = useMemo(
    () => [
      { value: 'profit', label: t('indicators.profit') },
      { value: 'revenue', label: t('indicators.revenue') }
    ],
    [t]
  )

  const columnDefs = useMemo(
    () => COLUMN_DEFS.map((c) => ({ ...c, label: t(`columns.${c.key}`) })),
    [t]
  )

  const [grouping, setGrouping] = useState('months')
  const [method, setMethod] = useState('cash')
  const [indicator, setIndicator] = useState('profit')
  const [visibleCols, setVisibleCols] = useState({ plan: true, fact: true, planExec: false, deviation: false, deviationPct: false })
  const [expanded, setExpanded] = useState({ income: true, expense: false })

  const toggleCol = (key) => {
    if (key === 'plan') return
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }))
  }
  const toggleRow = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const activeCols = columnDefs.filter((c) => visibleCols[c.key])
  const COL_WIDTH = 110
  const PERIOD_GROUP_WIDTH = activeCols.length * COL_WIDTH

  const aggregates = useMemo(() => {
    const map = {}
    const walk = (node) => {
      if (node.children?.length) node.children.forEach(walk)
      map[node.id] = aggregateNode(node)
    }
    STRUCTURE.forEach(walk)
    return map
  }, [])

  const netProfit = useMemo(() => {
    return PERIODS.reduce((acc, p) => {
      const inc = aggregates['income']?.[p.key] || zero()
      const exp = aggregates['expense']?.[p.key] || zero()
      acc[p.key] = { plan: inc.plan - exp.plan, fact: inc.fact - exp.fact }
      return acc
    }, {})
  }, [aggregates])

  const profitability = useMemo(() => {
    return PERIODS.reduce((acc, p) => {
      const inc = aggregates['income']?.[p.key] || zero()
      const net = netProfit[p.key]
      acc[p.key] = {
        plan: inc.plan === 0 ? null : (net.plan / inc.plan) * 100,
        fact: inc.fact === 0 ? null : (net.fact / inc.fact) * 100
      }
      return acc
    }, {})
  }, [aggregates, netProfit])

  // ---- Cell rendering ----------------------------------------------------

  const renderMetricCell = (colKey, metrics) => {
    const m = metrics
    if (colKey === 'plan') {
      return (
        <span className={m.plan !== 0 ? 'text-blue-600 font-medium' : 'text-slate-300'}>
          {formatNum(m.plan)}
        </span>
      )
    }
    if (colKey === 'fact') {
      return <span className="text-slate-800">{formatNum(m.fact)}</span>
    }
    if (colKey === 'planExec') {
      if (m.planExec == null) return <span className="text-slate-400">{t('na')}</span>
      const isOver = m.planExec > 110
      const isUnder = m.planExec < 90 && m.planExec !== 0
      return (
        <span className={isOver ? 'text-emerald-600' : isUnder ? 'text-rose-600' : 'text-slate-700'}>
          {formatPlanExec(m.planExec)}
        </span>
      )
    }
    if (colKey === 'deviation') {
      if (m.deviation === 0) return <span className="text-slate-300">0</span>
      return (
        <span className={m.deviation > 0 ? 'text-emerald-600' : 'text-rose-600'}>
          {formatNum(m.deviation, { showSign: true })}
        </span>
      )
    }
    if (colKey === 'deviationPct') {
      if (m.deviationPct == null) return <span className="text-slate-400">{t('na')}</span>
      if (Math.round(m.deviationPct) === 0) return <span className="text-slate-300">0%</span>
      return (
        <span className={m.deviationPct > 0 ? 'text-emerald-600' : 'text-rose-600'}>
          {formatDeviationPct(m.deviationPct)}
        </span>
      )
    }
    return null
  }

  const renderValueRow = (values, { boldClass = '', bgClass = '' } = {}) => {
    return periods.map((p, pIdx) => {
      const raw = values[p.key] || zero()
      const metrics = computeMetrics(raw)
      return (
        <div
          key={p.key}
          className={`flex shrink-0 ${pIdx < periods.length - 1 ? 'border-r border-neutral-200' : ''} ${bgClass}`}
          style={{ width: PERIOD_GROUP_WIDTH }}
        >
          {activeCols.map((c) => (
            <div
              key={c.key}
              className={`px-2 py-2 text-right border-r last:border-r-0 tabular-nums text-[12px] whitespace-nowrap ${boldClass}`}
              style={{ width: COL_WIDTH }}
            >
              {renderMetricCell(c.key, metrics)}
            </div>
          ))}
        </div>
      )
    })
  }

  const renderProfitabilityRow = () => {
    return periods.map((p, pIdx) => {
      const pct = profitability[p.key] || { plan: null, fact: null }
      return (
        <div
          key={p.key}
          className={`flex shrink-0 ${pIdx < periods.length - 1 ? 'border-r border-neutral-200' : ''}`}
          style={{ width: PERIOD_GROUP_WIDTH }}
        >
          {activeCols.map((c) => {
            let content = null
            if (c.key === 'plan') {
              const val = pct.plan
              content = (
                <span className={val != null ? 'text-blue-600 font-medium' : 'text-slate-300'}>
                  {val != null ? formatPct(val) : '0%'}
                </span>
              )
            } else if (c.key === 'fact') {
              const val = pct.fact
              content = (
                <span className="text-slate-800">
                  {val != null ? formatPct(val) : '0%'}
                </span>
              )
            } else {
              content = <span className="text-slate-400">{t('na')}</span>
            }
            return (
              <div
                key={c.key}
                className="px-2 py-2 text-right tabular-nums text-[12px] whitespace-nowrap font-semibold"
                style={{ width: COL_WIDTH }}
              >
                {content}
              </div>
            )
          })}
        </div>
      )
    })
  }

  const renderRow = (node, depth = 0) => {
    const isSection = node.kind === 'section'
    const hasChildren = !!node.children?.length
    const isExpanded = expanded[node.id]
    const indent = depth * 16

    const values = aggregates[node.id]
    const bold = isSection ? 'font-semibold' : ''
    const labelClass = isSection
      ? 'text-[13px] font-semibold text-slate-900'
      : 'text-[13px] text-slate-700'

    return (
      <div key={node.id}>
        <div className="flex items-stretch border-b border-neutral-100 hover:bg-slate-50/60 group">
          <div
            className={`sticky left-0 z-10 flex items-center w-[280px] min-w-[280px] px-3 py-2 bg-white group-hover:bg-slate-50 border-r border-neutral-200 ${labelClass}`}
            style={{ paddingLeft: 12 + indent }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleRow(node.id)}
                className="mr-2 inline-flex items-center justify-center w-4 h-4 border border-slate-300 rounded text-slate-500 hover:text-slate-700 hover:border-slate-400 transition-colors shrink-0 bg-white"
                aria-label={isExpanded ? t('actions.collapse') : t('actions.expand')}
              >
                {isExpanded ? <Minus className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
              </button>
            ) : (
              <span className="mr-2 w-4 h-4 shrink-0" />
            )}
            <span className="line-clamp-1">{t(node.labelKey)}</span>
          </div>
          {renderValueRow(values, { boldClass: bold })}
        </div>
        {hasChildren && isExpanded && node.children.map((child) => renderRow(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-2 border-b border-neutral-200 bg-white">
        <div className="text-[11px] text-slate-400">
          <button onClick={() => router.back()} className="hover:text-slate-600 transition-colors">
            {t('breadcrumb.list')}
          </button>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 mr-2">{t('title')}</h1>
            <Pill>{t('type')}</Pill>
            <Pill>{t('period')}</Pill>
            <Pill>{t('currency')}</Pill>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-neutral-200 hover:bg-slate-50 rounded-md transition-colors">
            <Download className="w-3.5 h-3.5" />
            {t('downloadXls')}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-neutral-200 bg-slate-50/50 flex-wrap">
        <div className="w-[160px]">
          <SingleSelect
            data={groupingOptions}
            value={grouping}
            onChange={setGrouping}
            isClearable={false}
            placeholder={t('grouping.placeholder')}
          />
        </div>
        <div className="w-[190px]">
          <SingleSelect
            data={methodOptions}
            value={method}
            onChange={setMethod}
            isClearable={false}
            placeholder={t('method.placeholder')}
          />
        </div>
        <div className="w-[200px]">
          <SingleSelect
            data={indicatorOptions}
            value={indicator}
            onChange={setIndicator}
            isClearable={false}
            placeholder={t('indicator.placeholder')}
          />
        </div>
        <div className="flex items-center gap-4 ml-2">
          {columnDefs.filter((c) => !c.alwaysOn).map((c) => (
            <OperationCheckbox
              key={c.key}
              checked={visibleCols[c.key]}
              onChange={() => toggleCol(c.key)}
              label={c.label}
            />
          ))}
        </div>
      </div>

      {/* Pivot table */}
      <div className="flex-1 overflow-auto ">
        <div className="min-w-max mb-5">
          {/* Period header row */}
          <div className="flex items-stretch sticky top-0 z-20 bg-white border-b border-neutral-200">
            <div className="sticky left-0 z-30 w-[280px] min-w-[280px] px-3 py-3 bg-white border-r border-neutral-200">
              <div className="text-[13px] font-semibold text-slate-900">{t('columns.article')}</div>
            </div>
            {periods.map((p, idx) => (
              <div
                key={p.key}
                className={`px-2 py-2.5 text-right text-[12px] font-medium text-slate-700 ${idx < periods.length - 1 ? 'border-r border-neutral-200' : ''}`}
                style={{ width: PERIOD_GROUP_WIDTH }}
              >
                {p.label}
              </div>
            ))}
          </div>

          {/* Entity sub-header */}
          <div className="flex items-stretch sticky top-[44px] z-20 bg-white border-b border-neutral-200">
            <div className="sticky left-0 z-30 w-[280px] min-w-[280px] px-3 py-2 bg-white border-r border-neutral-200">
              <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{t('entityHeader')}</span>
              </div>
            </div>
            {periods.map((p, pIdx) => (
              <div
                key={p.key}
                className={`flex shrink-0 ${pIdx < periods.length - 1 ? 'border-r border-neutral-200' : ''}`}
                style={{ width: PERIOD_GROUP_WIDTH }}
              >
                {activeCols.map((c) => (
                  <div
                    key={c.key}
                    className="px-2 py-2 border-r last:border-r-0 text-right text-[11px] text-slate-500"
                    style={{ width: COL_WIDTH }}
                  >
                    {c.label}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Rows */}
          {STRUCTURE.map((node) => renderRow(node))}

          {/* Net profit */}
          <div className="flex items-stretch border-b border-neutral-200 bg-white hover:bg-slate-50/60 group">
            <div className="sticky left-0 z-10 flex items-center w-[280px] min-w-[280px] px-3 py-2.5 bg-white group-hover:bg-slate-50/60 border-r border-neutral-200 text-[13px] font-semibold text-slate-900">
              <span className="mr-2 w-4 h-4 shrink-0" />
              {t('rows.netProfit')}
            </div>
            {renderValueRow(netProfit, { boldClass: 'font-semibold' })}
          </div>

          {/* Profitability */}
          <div className="flex items-stretch border-b border-neutral-200 bg-white hover:bg-slate-50/60 group">
            <div className="sticky left-0 z-10 flex items-center w-[280px] min-w-[280px] px-3 py-2.5 bg-white group-hover:bg-slate-50/60 border-r border-neutral-200 text-[13px] font-semibold text-slate-900">
              <span className="mr-2 w-4 h-4 shrink-0" />
              {t('rows.profitability')}
            </div>
            {renderProfitabilityRow()}
          </div>
        </div>
      </div>
    </div>
  )
}

const Pill = ({ children }) => (
  <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-slate-600 bg-slate-100 rounded">
    {children}
  </span>
)



export default IncomeExpenseBudgetSingle

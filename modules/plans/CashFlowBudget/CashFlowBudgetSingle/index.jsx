'use client'

import { Check, ChevronDown, Download, Minus, Plus } from 'lucide-react'
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
    id: 'balance-start',
    labelKey: 'rows.balanceStart',
    kind: 'balance',
    values: {
      total: v(8000000, 8000000),
      '2025-11': v(8000000, 8000000),
      '2025-12': v(4028860, 4028860),
      '2026-01': v(2519180, 2519180),
      '2026-02': v(2200000, 2050000),
      '2026-03': v(1900000, 1750000),
      '2026-04': v(1700000, 1500000),
      '2026-05': v(1500000, 1300000),
      '2026-06': v(1400000, 1200000),
      '2026-07': v(1300000, 1100000),
      '2026-08': v(1250000, 1050000),
      '2026-09': v(1200000, 1000000)
    }
  },
  {
    id: 'operating',
    labelKey: 'rows.operating',
    kind: 'section',
    children: [
      {
        id: 'income',
        labelKey: 'rows.income',
        kind: 'subsection',
        children: [
          {
            id: 'revenue',
            labelKey: 'rows.revenue',
            kind: 'category',
            values: {
              total: v(16656620, 15518000),
              '2025-11': v(400000, 2500000),
              '2025-12': v(4478000, 2428000),
              '2026-01': v(1500000, 1300000),
              '2026-02': v(1400000, 1300000),
              '2026-03': v(1400000, 1290000),
              '2026-04': v(1400000, 1280000),
              '2026-05': v(1400000, 1270000),
              '2026-06': v(1400000, 1280000),
              '2026-07': v(1400000, 1290000),
              '2026-08': v(1378620, 1290000),
              '2026-09': v(900000, 290000)
            }
          },
          {
            id: 'current-assets-in',
            labelKey: 'rows.currentAssets',
            kind: 'category',
            values: {
              total: v(3200000, 0),
              '2025-11': v(0, 0),
              '2025-12': v(0, 0),
              '2026-01': v(400000, 0),
              '2026-02': v(400000, 0),
              '2026-03': v(400000, 0),
              '2026-04': v(400000, 0),
              '2026-05': v(400000, 0),
              '2026-06': v(400000, 0),
              '2026-07': v(400000, 0),
              '2026-08': v(400000, 0),
              '2026-09': v(0, 0)
            }
          },
          {
            id: 'short-liabilities-in',
            labelKey: 'rows.shortLiabilities',
            kind: 'category',
            values: zeroPeriods()
          }
        ]
      },
      {
        id: 'expense',
        labelKey: 'rows.expense',
        kind: 'subsection',
        children: [
          {
            id: 'expenses',
            labelKey: 'rows.expenses',
            kind: 'category',
            values: {
              total: v(13555599, 8990980),
              '2025-11': v(620820, 321140),
              '2025-12': v(2454676, 2291706),
              '2026-01': v(1100000, 700000),
              '2026-02': v(1100000, 700000),
              '2026-03': v(1100000, 700000),
              '2026-04': v(1100000, 700000),
              '2026-05': v(1100000, 700000),
              '2026-06': v(1100000, 700000),
              '2026-07': v(1100000, 700000),
              '2026-08': v(1100000, 700000),
              '2026-09': v(1680103, 778134)
            }
          },
          {
            id: 'current-assets-out',
            labelKey: 'rows.currentAssets',
            kind: 'category',
            values: {
              total: v(6065000, 4718000),
              '2025-11': v(200000, 1090000),
              '2025-12': v(65000, 65000),
              '2026-01': v(600000, 350000),
              '2026-02': v(600000, 350000),
              '2026-03': v(600000, 350000),
              '2026-04': v(600000, 350000),
              '2026-05': v(600000, 350000),
              '2026-06': v(600000, 350000),
              '2026-07': v(600000, 350000),
              '2026-08': v(600000, 350000),
              '2026-09': v(600000, 313000)
            }
          },
          {
            id: 'short-liabilities-out',
            labelKey: 'rows.shortLiabilities',
            kind: 'category',
            values: zeroPeriods()
          }
        ]
      }
    ]
  },
  {
    id: 'investing',
    labelKey: 'rows.investing',
    kind: 'section',
    children: [
      {
        id: 'inv-out',
        labelKey: 'rows.investingOut',
        kind: 'category',
        values: {
          total: v(-5996502, -5600000),
          '2025-11': v(-5000000, -5000000),
          '2025-12': v(-600000, -600000),
          '2026-01': v(-50000, 0),
          '2026-02': v(-50000, 0),
          '2026-03': v(-50000, 0),
          '2026-04': v(-50000, 0),
          '2026-05': v(-50000, 0),
          '2026-06': v(-50000, 0),
          '2026-07': v(-50000, 0),
          '2026-08': v(-46502, 0),
          '2026-09': v(0, 0)
        }
      }
    ]
  },
  {
    id: 'financing',
    labelKey: 'rows.financing',
    kind: 'section',
    children: [
      {
        id: 'fin-line',
        labelKey: 'rows.financingOps',
        kind: 'category',
        values: {
          total: v(6461760, -1147160),
          '2025-11': v(7940000, -60000),
          '2025-12': v(-770360, -770360),
          '2026-01': v(-100000, -50000),
          '2026-02': v(-100000, -50000),
          '2026-03': v(-100000, -50000),
          '2026-04': v(-100000, -50000),
          '2026-05': v(-100000, -50000),
          '2026-06': v(-100000, -50000),
          '2026-07': v(-100000, -50000),
          '2026-08': v(-107880, -50000),
          '2026-09': v(0, 33200)
        }
      }
    ]
  }
]

const formatNum = (n, { showSign = false } = {}) => {
  if (n === 0 || n == null || Number.isNaN(n)) return '0'
  const rounded = Math.round(n)
  const abs = Math.abs(rounded)
  const formatted = new Intl.NumberFormat('ru-RU').format(abs).replace(/ /g, ' ')
  if (rounded < 0) return `−${formatted}`
  return showSign ? `+${formatted}` : formatted
}

const formatPlanExec = (n) => `${Math.round(n)}%`

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
  if (node.kind === 'category' || node.kind === 'balance') {
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

const CashFlowBudgetSingle = () => {
  const router = useRouter()
  const t = useTranslations('Plans.CashFlowBudgetSingle')

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
      { key: 'months', label: t('grouping.months') },
      { key: 'quarters', label: t('grouping.quarters') },
      { key: 'years', label: t('grouping.years') }
    ],
    [t]
  )

  const columnDefs = useMemo(
    () => COLUMN_DEFS.map((c) => ({ ...c, label: t(`columns.${c.key}`) })),
    [t]
  )

  const [grouping, setGrouping] = useState('months')
  const [groupingOpen, setGroupingOpen] = useState(false)
  const [visibleCols, setVisibleCols] = useState({ plan: true, fact: true, planExec: true, deviation: true, deviationPct: true })
  const [expanded, setExpanded] = useState({
    operating: true,
    income: true,
    expense: true,
    investing: false,
    financing: false
  })

  const toggleCol = (key) => {
    if (key === 'plan') return
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }))
  }
  const toggleRow = (rowId) => setExpanded((prev) => ({ ...prev, [rowId]: !prev[rowId] }))

  const activeCols = columnDefs.filter((c) => visibleCols[c.key])
  const COL_WIDTH = 110
  const PERIOD_GROUP_WIDTH = activeCols.length * COL_WIDTH

  const aggregates = useMemo(() => {
    const map = {}
    const walk = (node) => {
      map[node.id] = aggregateNode(node)
      if (node.children) node.children.forEach(walk)
    }
    STRUCTURE.forEach(walk)
    return map
  }, [])

  const totalCashFlow = useMemo(() => {
    return PERIODS.reduce((acc, p) => {
      const op = aggregates['operating'][p.key]
      const inv = aggregates['investing'][p.key]
      const fin = aggregates['financing'][p.key]
      acc[p.key] = {
        plan: op.plan + inv.plan + fin.plan,
        fact: op.fact + inv.fact + fin.fact
      }
      return acc
    }, {})
  }, [aggregates])

  const closingBalance = useMemo(() => {
    const opening = aggregates['balance-start']
    return PERIODS.reduce((acc, p) => {
      acc[p.key] = {
        plan: opening[p.key].plan + totalCashFlow[p.key].plan,
        fact: opening[p.key].fact + totalCashFlow[p.key].fact
      }
      return acc
    }, {})
  }, [aggregates, totalCashFlow])

  // ---- Cell rendering ---------------------------------------------------

  const renderMetricCell = (colKey, metrics) => {
    const m = metrics
    if (colKey === 'plan') {
      return (
        <span className={m.plan !== 0 ? 'text-blue-600 font-medium' : 'text-slate-400'}>
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
      if (m.deviation === 0) return <span className="text-slate-400">0</span>
      return (
        <span className={m.deviation > 0 ? 'text-emerald-600' : 'text-rose-600'}>
          {formatNum(m.deviation, { showSign: true })}
        </span>
      )
    }
    if (colKey === 'deviationPct') {
      if (m.deviationPct == null) return <span className="text-slate-400">{t('na')}</span>
      if (Math.round(m.deviationPct) === 0) return <span className="text-slate-400">0%</span>
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
      const metrics = computeMetrics(values[p.key] || zero())
      return (
        <div
          key={p.key}
          className={`flex shrink-0 ${pIdx < periods.length - 1 ? 'border-r border-neutral-200' : ''} ${bgClass}`}
          style={{ width: PERIOD_GROUP_WIDTH }}
        >
          {activeCols.map((c) => (
            <div
              key={c.key}
              className={`px-3 py-2 text-right tabular-nums text-[12px] whitespace-nowrap ${boldClass}`}
              style={{ width: COL_WIDTH }}
            >
              {renderMetricCell(c.key, metrics)}
            </div>
          ))}
        </div>
      )
    })
  }

  const renderRow = (node, depth = 0) => {
    const isBalance = node.kind === 'balance'
    const isSection = node.kind === 'section'
    const isSubsection = node.kind === 'subsection'
    const hasChildren = !!node.children?.length
    const isExpanded = expanded[node.id]
    const indent = depth * 18

    const values = aggregates[node.id]

    let labelBg = 'bg-white'
    let labelClass = 'text-slate-800 text-[13px]'
    let bold = ''
    let cellBg = ''

    if (isBalance) {
      labelClass = 'text-slate-900 text-[13px] font-semibold'
      bold = 'font-semibold'
    }
    if (isSection) {
      labelClass = 'text-slate-900 text-[13px] font-semibold'
      bold = 'font-semibold'
    }
    if (isSubsection) {
      labelBg = 'bg-sky-50'
      cellBg = 'bg-sky-50'
      labelClass = 'text-slate-800 text-[13px] font-medium'
      bold = 'font-medium'
    }

    return (
      <div key={node.id}>
        <div className={`flex items-stretch border-b border-neutral-100 group ${cellBg || 'hover:bg-slate-50/60'}`}>
          <div
            className={`sticky left-0 bg-white z-10 flex items-center w-[300px] min-w-[300px] px-3 py-2 ${labelBg} ${!cellBg ? 'group-hover:bg-slate-50' : ''} border-r border-neutral-200 ${labelClass}`}
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

          {renderValueRow(values, { boldClass: bold, bgClass: cellBg })}
        </div>

        {hasChildren && isExpanded && node.children.map((child) => renderRow(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 pt-2 pb-1 border-b border-neutral-200 bg-white">
        <div className="text-[11px] text-slate-400 mb-2">
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
      <div className="flex items-center gap-5 px-6 py-3 border-b border-neutral-200 bg-slate-50/50">
        <div className="relative">
          <button
            type="button"
            onClick={() => setGroupingOpen((o) => !o)}
            onBlur={() => setTimeout(() => setGroupingOpen(false), 150)}
            className="flex items-center justify-between w-[170px] px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-neutral-200 hover:border-slate-300 rounded-md transition-colors"
          >
            <span>{groupingOptions.find((o) => o.key === grouping)?.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${groupingOpen ? 'rotate-180' : ''}`} />
          </button>
          {groupingOpen && (
            <div className="absolute top-full left-0 mt-1 w-[170px] bg-white border border-neutral-200 rounded-md shadow-lg z-30 py-1">
              {groupingOptions.map((opt) => (
                <button
                  key={opt.key}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setGrouping(opt.key)
                    setGroupingOpen(false)
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 ${
                    grouping === opt.key ? 'text-blue-600 font-medium' : 'text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {columnDefs.filter((c) => !c.alwaysOn).map((c) => (
            <Checkbox
              key={c.key}
              checked={visibleCols[c.key]}
              onChange={() => toggleCol(c.key)}
              label={c.label}
            />
          ))}
        </div>
      </div>

      {/* Pivot table */}
      <div className="flex-1 overflow-auto pb-5">
        <div className="min-w-max">
          {/* Period group header */}
          <div className="flex items-stretch sticky top-0 z-20 bg-white border-b border-neutral-200">
            <div className="sticky left-0 z-30 w-[300px] min-w-[300px] px-3 py-3 bg-white border-r border-neutral-200">
              <div className="text-[13px] font-semibold text-slate-900">
                {t('columns.article')}
              </div>
            </div>
            {periods.map((p, idx) => (
              <div
                key={p.key}
                className={`px-3 py-2.5 text-right text-[12px] font-medium text-slate-700 ${idx < periods.length - 1 ? 'border-r border-neutral-200' : ''}`}
                style={{ width: PERIOD_GROUP_WIDTH }}
              >
                {p.label}
              </div>
            ))}
          </div>

          {/* Sub-column header */}
          <div className="flex items-stretch sticky top-[44px] z-20 bg-white border-b border-neutral-200">
            <div className="sticky left-0 z-30 w-[300px] min-w-[300px] bg-white border-r border-neutral-200" />
            {periods.map((p, pIdx) => (
              <div
                key={p.key}
                className={`flex shrink-0 ${pIdx < periods.length - 1 ? 'border-r border-neutral-200' : ''}`}
                style={{ width: PERIOD_GROUP_WIDTH }}
              >
                {activeCols.map((c) => (
                  <div
                    key={c.key}
                    className="px-3 py-2 text-right text-[11px] font-normal text-slate-500"
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

          {/* Total cash flow */}
          <div className="flex items-stretch border-b border-neutral-200 bg-white hover:bg-slate-50/60 group">
            <div className="sticky left-0 z-10 flex items-center w-[300px] min-w-[300px] px-3 py-2.5 bg-white group-hover:bg-slate-50/60 border-r border-neutral-200 text-[13px] font-semibold text-slate-900">
              <span className="mr-2 w-4 h-4 shrink-0" />
              {t('rows.totalFlow')}
            </div>
            {renderValueRow(totalCashFlow, { boldClass: 'font-semibold' })}
          </div>

          {/* Closing balance */}
          <div className="flex items-stretch border-b border-neutral-200 bg-white hover:bg-slate-50/60 group">
            <div className="sticky left-0 z-10 flex items-center w-[300px] min-w-[300px] px-3 py-2.5 bg-white group-hover:bg-slate-50/60 border-r border-neutral-200 text-[13px] font-semibold text-slate-900">
              <span className="mr-2 w-4 h-4 shrink-0" />
              {t('rows.closingBalance')}
            </div>
            {renderValueRow(closingBalance, { boldClass: 'font-semibold' })}
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

const Checkbox = ({ checked, onChange, label }) => (
  <label className="inline-flex items-center gap-2 cursor-pointer select-none" onClick={onChange}>
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded border transition-colors ${
        checked ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300 hover:border-slate-400'
      }`}
    >
      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </span>
    <span className="text-xs text-slate-700">{label}</span>
  </label>
)

export default CashFlowBudgetSingle

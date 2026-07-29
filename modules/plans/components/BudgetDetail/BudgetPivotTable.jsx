'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Loader2, Minus, MoreVertical, Plus, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import {
  deviation,
  deviationPercent,
  formatDeviation,
  formatMoney,
  formatPercent,
  parseInputNumber,
  planExecution,
  toInputValue
} from '@/modules/plans/utils/format'
import { buildPeriodColumns } from '@/modules/plans/utils/periods'
import { BUDGET_TOKENS as T, COLUMN_DEFS } from '@/modules/plans/utils/tokens'

/* ------------------------------------------------------------------ */
/* Агрегация                                                          */
/* ------------------------------------------------------------------ */

const emptyCell = () => ({ plan: 0, fact: 0 })

/**
 * Считает значения по всем месяцам для каждой строки дерева.
 * Возвращает map: rowId → { 'YYYY-MM': { plan, fact } }
 */
const buildMonthlyValues = (rows, months, planOverrides) => {
  const byRow = {}

  /** Собственные значения узла (без потомков) с учётом локальной правки плана. */
  const ownValues = (node) => {
    const values = {}
    months.forEach((m) => {
      const base = node.values?.[m] || emptyCell()
      const override = planOverrides?.[`${node.id}|${m}`]
      values[m] = { plan: override != null ? override : base.plan || 0, fact: base.fact || 0 }
    })
    return values
  }

  const walk = (node) => {
    if (node.kind === 'computed' || node.kind === 'ratio') {
      byRow[node.id] = null // считается позже, после всех обычных строк
      return
    }
    if (!node.children?.length) {
      byRow[node.id] = ownValues(node)
      return
    }
    node.children.forEach(walk)
    // Группа = собственные значения (у данных из API это «остаток» узла,
    // у мока — их нет) плюс сумма потомков
    const own = ownValues(node)
    const values = {}
    months.forEach((m) => {
      values[m] = node.children.reduce(
        (acc, child) => {
          const cv = byRow[child.id]?.[m] || emptyCell()
          return { plan: acc.plan + cv.plan, fact: acc.fact + cv.fact }
        },
        own[m]
      )
    })
    byRow[node.id] = values
  }

  rows.forEach(walk)

  // Вычисляемые строки — во втором проходе, они могут ссылаться на любые id
  const resolve = (id, m) => byRow[id]?.[m] || emptyCell()
  const computeWalk = (node) => {
    if ((node.kind === 'computed' || node.kind === 'ratio') && typeof node.compute === 'function') {
      const values = {}
      months.forEach((m) => {
        values[m] = node.compute(resolve, m) || emptyCell()
      })
      byRow[node.id] = values
    }
    node.children?.forEach(computeWalk)
  }
  rows.forEach(computeWalk)

  return byRow
}

/** Суммирует месячные значения строки по месяцам колонки. */
const sumMonths = (values, months) => {
  if (!values) return emptyCell()
  return months.reduce(
    (acc, m) => {
      const cv = values[m] || emptyCell()
      return { plan: acc.plan + cv.plan, fact: acc.fact + cv.fact }
    },
    emptyCell()
  )
}

/** Среднее по месяцам — для процентных строк, которые нельзя складывать. */
const avgMonths = (values, months) => {
  if (!values || !months.length) return emptyCell()
  const sum = sumMonths(values, months)
  return { plan: sum.plan / months.length, fact: sum.fact / months.length }
}

/**
 * Агрегация значения строки по колонке.
 * Остатки на начало/конец не суммируются: берётся первый / последний месяц —
 * как в ПланФакт. Процентные строки за весь период берутся из итогов API,
 * за свёрнутый период — усредняются.
 */
const aggregateNode = (node, byRow, col) => {
  const months = col.months
  if (node?.kind === 'ratio' && typeof node.aggregate === 'function') {
    const resolve = (id) => sumMonths(byRow[id], months)
    return node.aggregate(resolve) || { plan: null, fact: null }
  }
  const values = byRow[node.id]
  if (months.length === 1) return values?.[months[0]] || emptyCell()
  if (node?.aggregation === 'first') return values?.[months[0]] || emptyCell()
  if (node?.aggregation === 'last') return values?.[months[months.length - 1]] || emptyCell()
  if (node?.aggregation === 'percent') {
    if (col.kind === 'total' && node.periodTotals) return node.periodTotals
    return avgMonths(values, months)
  }
  return sumMonths(values, months)
}

/* ------------------------------------------------------------------ */
/* Ячейки                                                             */
/* ------------------------------------------------------------------ */

const CellShell = ({ children, bold, bg, isLast, onClick, editable }) => (
  <div
    onClick={onClick}
    className={`flex shrink-0 items-center justify-end tabular-nums ${editable ? 'cursor-text' : ''}`}
    style={{
      width: T.cellWidth,
      height: '100%',
      padding: '0 10px 0 0',
      fontSize: 12,
      lineHeight: '17px',
      fontWeight: bold ? 600 : 400,
      color: T.text,
      background: bg || 'transparent',
      borderRight: isLast ? 'none' : `1px solid ${T.border}`
    }}
  >
    {children}
  </div>
)

/* ------------------------------------------------------------------ */
/* Таблица                                                            */
/* ------------------------------------------------------------------ */

/**
 * Сводная таблица бюджета — 1 в 1 с ПланФакт.
 *
 * @param {object}   props
 * @param {string}   props.entityTitle     заголовок первой колонки (юрлицо/бюджет)
 * @param {string}   props.entitySubtitle  проект под заголовком
 * @param {Array}    props.rows            дерево статей
 * @param {string}   props.start           'YYYY-MM'
 * @param {string}   props.end             'YYYY-MM'
 * @param {string}   props.grouping        months | quarters | years
 * @param {object}   props.visibleCols     { fact, planExec, deviation, deviationPct }
 * @param {Function} props.t               переводчик секции страницы
 * @param {boolean}  props.editable        разрешить правку плановых ячеек
 * @param {Function} props.onPlanChange    ({ rowId, month, amount }) → запись плана в API
 * @param {boolean}  props.loading         идёт загрузка дерева
 * @param {string}   props.emptyLabel      текст, когда строк нет
 */
const BudgetPivotTable = ({
  entityTitle,
  entitySubtitle,
  rows,
  start,
  end,
  grouping,
  visibleCols,
  t,
  editable = true,
  hiddenRowIds = [],
  onPlanChange,
  loading = false,
  emptyLabel
}) => {
  const [collapsedPeriods, setCollapsedPeriods] = useState({})
  const [expandedRows, setExpandedRows] = useState(() => {
    const init = {}
    const walk = (n) => {
      if (n.children?.length) init[n.id] = n.defaultExpanded !== false
      n.children?.forEach(walk)
    }
    rows.forEach(walk)
    return init
  })
  const [planOverrides, setPlanOverrides] = useState({})
  const [editing, setEditing] = useState(null) // `${rowId}|${monthKey}`

  // Пришло свежее дерево — локальные правки больше не нужны, в нём уже
  // пересчитанные бэкендом значения (сброс во время рендера, а не в эффекте)
  const [renderedRows, setRenderedRows] = useState(rows)
  if (renderedRows !== rows) {
    setRenderedRows(rows)
    setPlanOverrides({})
  }

  const labels = useMemo(
    () => ({
      total: t('periodTotal'),
      monthShort: (m, y) => `${t(`monthsShort.${m}`)}' ${String(y).slice(2)}`,
      monthFull: (m) => t(`months.${m}`),
      quarter: (q, y) => (grouping === 'years' ? t('quarter', { q }) : `${q} ${t('quarterShort')}' ${String(y).slice(2)}`),
      year: (y) => String(y)
    }),
    [t, grouping]
  )

  const columns = useMemo(
    () => buildPeriodColumns({ start, end, grouping, collapsed: collapsedPeriods, labels }),
    [start, end, grouping, collapsedPeriods, labels]
  )

  const months = useMemo(() => columns[0]?.months || [], [columns])
  const byRow = useMemo(() => buildMonthlyValues(rows, months, planOverrides), [rows, months, planOverrides])

  const activeCols = useMemo(
    () =>
      COLUMN_DEFS.filter(
        (c) => c.alwaysOn || (visibleCols[c.key] && (!c.dependsOn || visibleCols[c.dependsOn]))
      ),
    [visibleCols]
  )
  const groupWidth = activeCols.length * T.cellWidth

  const togglePeriod = useCallback((id) => {
    setCollapsedPeriods((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const toggleRow = useCallback((id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  /** Правка плана: локально — сразу, на бэк — через onPlanChange. */
  const setPlanValue = useCallback(
    (rowId, month, amount) => {
      setPlanOverrides((prev) => ({ ...prev, [`${rowId}|${month}`]: amount }))
      onPlanChange?.({ rowId, month, amount })
    },
    [onPlanChange]
  )

  const clearColumn = useCallback(
    (column) => {
      const targets = []
      const walk = (n) => {
        if (!n.children?.length && n.kind !== 'computed' && n.kind !== 'ratio' && n.editable !== false) {
          targets.push(n)
        }
        n.children?.forEach(walk)
      }
      rows.forEach(walk)

      setPlanOverrides((prev) => {
        const next = { ...prev }
        targets.forEach((n) => {
          column.months.forEach((m) => {
            next[`${n.id}|${m}`] = 0
          })
        })
        return next
      })

      // на бэк отправляем только реально непустые ячейки
      targets.forEach((n) => {
        column.months.forEach((m) => {
          const current = planOverrides[`${n.id}|${m}`] ?? n.values?.[m]?.plan ?? 0
          if (current !== 0) onPlanChange?.({ rowId: n.id, month: m, amount: 0 })
        })
      })
    },
    [rows, planOverrides, onPlanChange]
  )

  /* -------------------------------------------------------------- */
  /* Рендер шапки                                                   */
  /* -------------------------------------------------------------- */

  const CollapseBtn = ({ id, collapsed }) => (
    <button
      type='button'
      onClick={() => togglePeriod(id)}
      className='ml-1.5 inline-flex shrink-0 items-center justify-center transition-colors hover:border-slate-400'
      style={{ width: 14, height: 14, border: `1px solid ${T.borderStrong}`, borderRadius: 2, color: T.textMuted, background: T.white }}
      aria-label={collapsed ? t('actions.expand') : t('actions.collapse')}
    >
      {collapsed ? <Plus style={{ width: 9, height: 9 }} /> : <Minus style={{ width: 9, height: 9 }} />}
    </button>
  )

  const renderHead = () => (
    <div
      className='sticky top-0 flex items-stretch bg-white'
      style={{ zIndex: 30, borderBottom: `1px solid ${T.border}` }}
    >
      {/* Первая колонка */}
      <div
        className='sticky left-0 flex shrink-0 flex-col justify-end bg-white'
        style={{
          zIndex: 31,
          width: T.titleColWidth,
          minWidth: T.titleColWidth,
          height: T.headerFirstRowHeight + T.headerSecondRowHeight,
          padding: `0 12px ${T.headerSecondRowHeight + 8}px 20px`,
          borderRight: `1px solid ${T.border}`
        }}
      >
        <div className='truncate' style={{ fontSize: 16, fontWeight: 700, color: T.textHeading }}>
          {entityTitle}
        </div>
        {entitySubtitle && (
          <div className='truncate' style={{ fontSize: 12, color: T.textMuted }}>
            {entitySubtitle}
          </div>
        )}
      </div>

      {/* Группы периодов */}
      <div className='flex items-stretch'>
        {columns.map((col, idx) => {
          const isLast = idx === columns.length - 1
          return (
            <div
              key={col.id}
              className='flex shrink-0 flex-col'
              style={{ width: groupWidth, borderRight: isLast ? 'none' : `1px solid ${T.border}` }}
            >
              {/* Верхняя часть: год / квартал / сам период */}
              <div
                className='flex flex-col items-end justify-end'
                style={{ height: T.headerFirstRowHeight, padding: '0 10px 6px 0', gap: 2 }}
              >
                {col.head.year && (
                  <div className='flex items-center' style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                    <span>{col.head.year.label}</span>
                    <CollapseBtn id={col.head.year.id} collapsed={false} />
                  </div>
                )}
                {col.head.quarter && (
                  <div className='flex items-center' style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                    <span>{col.head.quarter.label}</span>
                    <CollapseBtn id={col.head.quarter.id} collapsed={false} />
                  </div>
                )}
                <div className='flex items-center' style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                  <span className='capitalize'>{col.head.self}</span>
                  {col.head.collapsedNode && <CollapseBtn id={col.head.collapsedNode.id} collapsed />}
                </div>
              </div>

              {/* Нижняя часть: план/факт/… */}
              <div
                className='flex items-stretch'
                style={{ height: T.headerSecondRowHeight, borderTop: `1px solid ${T.border}` }}
              >
                {activeCols.map((c, ci) => (
                  <div
                    key={c.key}
                    className='flex shrink-0 items-center justify-end gap-1'
                    style={{
                      width: T.cellWidth,
                      padding: '0 10px 0 0',
                      fontSize: 12,
                      color: T.text,
                      borderRight: ci === activeCols.length - 1 ? 'none' : `1px solid ${T.border}`
                    }}
                  >
                    <span className='whitespace-nowrap'>{t(`columns.${c.key}`)}</span>
                    {c.key === 'plan' && editable && col.kind !== 'total' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type='button'
                            className='inline-flex items-center justify-center text-gray-400 transition-colors hover:text-slate-700'
                            style={{ marginRight: -6 }}
                            aria-label={t('actions.columnMenu')}
                          >
                            <MoreVertical style={{ width: 14, height: 14 }} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className='w-48 p-2' align='end'>
                          <DropdownMenuItem asChild>
                            <button
                              className='flex w-full cursor-pointer items-center gap-2 text-sm outline-none'
                              onClick={() => clearColumn(col)}
                            >
                              <Trash2 className='h-4 w-4' />
                              <span>{t('actions.clearColumn')}</span>
                            </button>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  /* -------------------------------------------------------------- */
  /* Рендер строк                                                   */
  /* -------------------------------------------------------------- */

  const renderCellContent = (colKey, metrics) => {
    const { plan, fact } = metrics
    if (colKey === 'plan') return formatMoney(plan)
    if (colKey === 'fact') return formatMoney(fact)
    if (colKey === 'planExec') return formatPercent(planExecution(plan, fact), t('na'))
    if (colKey === 'deviation') return formatDeviation(deviation(plan, fact))
    if (colKey === 'deviationPct') return formatPercent(deviationPercent(plan, fact), t('na'))
    return null
  }

  const renderRatioContent = (colKey, metrics) => {
    const { plan, fact } = metrics
    if (colKey === 'plan') return formatPercent(plan, t('na'))
    if (colKey === 'fact') return formatPercent(fact, t('na'))
    if (colKey === 'planExec') return formatPercent(planExecution(plan, fact), t('na'))
    if (colKey === 'deviation') return formatPercent(fact == null || plan == null ? null : deviation(plan, fact), t('na'))
    if (colKey === 'deviationPct') return formatPercent(deviationPercent(plan, fact), t('na'))
    return null
  }

  const renderRow = (node, depth) => {
    if (hiddenRowIds.includes(node.id)) return null
    const hasChildren = !!node.children?.length
    const isExpanded = expandedRows[node.id] ?? node.defaultExpanded !== false
    const isRatio = node.kind === 'ratio' || !!node.isPercent
    const isLeafArticle = !hasChildren && node.kind !== 'computed' && !isRatio
    const rowEditable = editable && isLeafArticle && node.editable !== false
    const bold = node.bold ?? depth === 0

    return (
      <div key={node.id}>
        <div className='group flex items-stretch' style={{ height: T.rowHeight, borderBottom: `1px solid ${T.border}` }}>
          {/* Название статьи */}
          <div
            className='sticky left-0 flex shrink-0 items-center bg-white group-hover:bg-gray-50'
            style={{
              zIndex: 10,
              width: T.titleColWidth,
              minWidth: T.titleColWidth,
              paddingLeft: T.indentBase + depth * T.indentStep,
              paddingRight: 12,
              borderRight: `1px solid ${T.border}`,
              fontSize: 12,
              lineHeight: '17px',
              fontWeight: bold ? 600 : 400,
              color: T.text
            }}
          >
            {hasChildren ? (
              <button
                type='button'
                onClick={() => toggleRow(node.id)}
                className='mr-2 inline-flex shrink-0 items-center justify-center bg-white transition-colors hover:border-slate-400'
                style={{ width: 14, height: 14, border: `1px solid ${T.borderStrong}`, borderRadius: 2, color: T.textMuted }}
                aria-label={isExpanded ? t('actions.collapse') : t('actions.expand')}
              >
                {isExpanded ? <Minus style={{ width: 9, height: 9 }} /> : <Plus style={{ width: 9, height: 9 }} />}
              </button>
            ) : (
              <span className='mr-2 inline-block shrink-0' style={{ width: 14 }} />
            )}
            <span className='truncate' title={node.label}>
              {node.label}
            </span>
          </div>

          {/* Значения */}
          <div className='flex items-stretch'>
            {columns.map((col, ci) => {
              const isLastGroup = ci === columns.length - 1
              const metrics = aggregateNode(node, byRow, col)

              return (
                <div
                  key={col.id}
                  className='flex shrink-0 items-stretch group-hover:bg-gray-50'
                  style={{ width: groupWidth, borderRight: isLastGroup ? 'none' : `1px solid ${T.border}` }}
                >
                  {activeCols.map((c, i) => {
                    const isLastCell = i === activeCols.length - 1
                    const isEditableCell =
                      rowEditable && c.key === 'plan' && col.kind === 'month'
                    const editKey = `${node.id}|${col.months[0]}`
                    // Ключ месяца совпадает у «Итого» и свёрнутых периодов с их
                    // первым месяцем, поэтому инпут показываем только в самой
                    // редактируемой ячейке — иначе их монтируется несколько
                    // и autoFocus последнего сбрасывает blur предыдущего.
                    const isEditing = isEditableCell && editing === editKey

                    if (isEditing) {
                      return (
                        <div
                          key={c.key}
                          className='flex shrink-0 items-center'
                          style={{ width: T.cellWidth, borderRight: isLastCell ? 'none' : `1px solid ${T.border}` }}
                        >
                          <input
                            autoFocus
                            defaultValue={toInputValue(metrics.plan)}
                            onBlur={(e) => {
                              const parsed = parseInputNumber(e.target.value) ?? 0
                              if (parsed !== metrics.plan) setPlanValue(node.id, col.months[0], parsed)
                              setEditing(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur()
                              if (e.key === 'Escape') setEditing(null)
                            }}
                            className='w-full bg-white text-right tabular-nums outline-none'
                            style={{
                              height: T.rowHeight - 2,
                              padding: '0 9px',
                              fontSize: 12,
                              color: T.text,
                              border: `1px solid ${T.accent}`
                            }}
                          />
                        </div>
                      )
                    }

                    const isPlanValue = c.key === 'plan' && isLeafArticle && metrics.plan !== 0
                    return (
                      <CellShell
                        key={c.key}
                        bold={bold}
                        isLast={isLastCell}
                        editable={isEditableCell}
                        bg={isEditableCell ? T.editableBg : undefined}
                        onClick={isEditableCell ? () => setEditing(editKey) : undefined}
                      >
                        <span style={isPlanValue && !isRatio ? { color: T.planValue } : undefined}>
                          {isRatio ? renderRatioContent(c.key, metrics) : renderCellContent(c.key, metrics)}
                        </span>
                      </CellShell>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {hasChildren && isExpanded && node.children.map((child) => renderRow(child, depth + 1))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className='flex flex-1 items-center justify-center bg-white'>
        <Loader2 className='h-6 w-6 animate-spin' style={{ color: T.planValue }} />
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className='flex flex-1 items-center justify-center bg-white' style={{ color: T.textMuted, fontSize: 13 }}>
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className='flex-1 overflow-auto bg-white'>
      <div className='min-w-max'>
        {renderHead()}
        {rows.map((node) => renderRow(node, 0))}
      </div>
    </div>
  )
}

export default BudgetPivotTable

/**
 * Преобразование дерева `get_budget_plan` в строки BudgetPivotTable.
 *
 * API отдаёт узлы с накопленными (roll-up) значениями:
 *   values[m]       — факт узла вместе с потомками
 *   plan[m].total   — план узла вместе с потомками
 *   plan[m].by      — план, записанный на сам узел
 *   plan[m].profit  — отклонение («Откл.») со знаком от бэка
 *
 * Таблица же суммирует дерево снизу вверх, поэтому в `values` кладём
 * «собственный остаток» узла (значение минус сумма потомков). Так итоги
 * совпадают с API, а правка плана в листе сразу поднимается по всем родителям
 * ещё до перезапроса.
 */

import { isUUID } from '@/utils/helpers'

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

/**
 * План можно писать только в реальные статьи учёта — у них id это guid
 * chart_of_accounts. Синтетические узлы отчёта (`revenue`, `other-expenses`,
 * `ebitda`, `net-profit` …) считаются на бэке, в них писать нельзя.
 * Наличие потомков значения не имеет: у статьи с подстатьями план пишется
 * на неё саму (`plan.by`), а `plan.total` собирается уже с детьми.
 * Слайс — на случай суффиксов в id (в отчётах встречается `<guid>':N`).
 */
const isAccountId = (id) => isUUID(String(id || '').slice(0, 36))

/** Строки-остатки не суммируются по месяцам: берётся первый / последний месяц. */
const OPENING_BALANCE_IDS = ['starting-balance', 'opening-balance', 'balance-start']
const CLOSING_BALANCE_IDS = ['ending-balance', 'closing-balance', 'balance-end']

/** Типы узлов, в которые нельзя писать план — считаются на бэке. */
const DERIVED_TYPES = ['percent', 'result', 'total']

const aggregationFor = (node) => {
  const id = String(node?.id || '')
  if (OPENING_BALANCE_IDS.includes(id)) return 'first'
  if (CLOSING_BALANCE_IDS.includes(id)) return 'last'
  if (node?.type === 'percent') return 'percent'
  return undefined
}

/**
 * Направление «Откл.» у строки: бэк считает profit как «факт − план»
 * в доходных статьях и «план − факт» в расходных. Своей формулы не вводим —
 * определяем знак по самому ответу (по первой ячейке, где он однозначен).
 * Нужен только чтобы пересчитать ячейку сразу после правки плана, пока
 * дерево не перезапрошено; если знак не определить — берём родительский.
 */
const profitSignOf = (samples, fallback) => {
  for (const s of samples) {
    const diff = num(s.fact) - num(s.plan)
    const profit = num(s.profit)
    if (!diff || !profit) continue
    return Math.sign(profit) === Math.sign(diff) ? 1 : -1
  }
  return fallback
}

/**
 * @param {Array} apiRows      data.rows из get_budget_plan
 * @param {Array} legend       data.legend — определяет набор месяцев
 * @returns {Array} дерево строк для BudgetPivotTable
 */
export const buildBudgetRows = (apiRows = [], legend = []) => {
  const months = legend.map((p) => p.key)

  const mapNode = (node, level = 0, parentProfitSign = 1) => {
    const profitSign = profitSignOf(
      [
        { plan: node?.plan?.total, fact: node?.totalValue, profit: node?.plan?.profit },
        ...months.map((m) => ({
          plan: node?.plan?.[m]?.total,
          fact: node?.values?.[m],
          profit: node?.plan?.[m]?.profit,
        })),
      ],
      parentProfitSign
    )
    const children = (node?.details || []).map((child) => mapNode(child, level + 1, profitSign))
    const isPercent = node?.type === 'percent'
    const isDerived = DERIVED_TYPES.includes(node?.type)
    const aggregation = aggregationFor(node)

    // собственный остаток = значение узла − сумма потомков
    const values = {}
    months.forEach((m) => {
      const factTotal = num(node?.values?.[m])
      const planTotal = num(node?.plan?.[m]?.total)
      const profitTotal = num(node?.plan?.[m]?.profit)
      const childFact = children.reduce((s, c) => s + num(c.apiTotals?.[m]?.fact), 0)
      const childPlan = children.reduce((s, c) => s + num(c.apiTotals?.[m]?.plan), 0)
      const childProfit = children.reduce((s, c) => s + num(c.apiTotals?.[m]?.profit), 0)
      values[m] = isPercent
        ? { plan: planTotal, fact: factTotal, profit: profitTotal }
        : {
            plan: planTotal - childPlan,
            fact: factTotal - childFact,
            profit: profitTotal - childProfit,
          }
    })

    // накопленные значения API — нужны родителю для расчёта остатка
    const apiTotals = {}
    months.forEach((m) => {
      apiTotals[m] = {
        plan: num(node?.plan?.[m]?.total),
        fact: num(node?.values?.[m]),
        profit: num(node?.plan?.[m]?.profit),
      }
    })

    return {
      id: node?.id,
      label: node?.name || '',
      kind: children.length ? 'group' : 'article',
      apiType: node?.type,
      isPercent,
      bold: level === 0 || node?.type === 'result' || node?.type === 'total',
      editable: isAccountId(node?.id) && !isDerived && !aggregation,
      defaultExpanded: level === 0,
      aggregation,
      profitSign,
      values,
      apiTotals,
      // Итоги за весь период — берём из `plan` как есть, а не пересчитываем
      // сложением месяцев: у процентных строк это невозможно, а у остальных
      // бэк уже отдал roll-up (`plan.total`), факт (`totalValue`) и «Откл.».
      periodTotals: {
        plan: num(node?.plan?.total),
        fact: num(node?.totalValue),
        profit: num(node?.plan?.profit),
      },
      // собственный план узла за весь период (`plan.by`) — его и правит
      // ячейка «Итого», как `plan[m].by` правят месячные ячейки
      periodOwnPlan: num(node?.plan?.by),
      children: children.length ? children : undefined,
    }
  }

  return (apiRows || []).map((node) => mapNode(node, 0))
}

/**
 * Строки показателей прибыли в БДР. API не документирует их id, поэтому
 * ищем и по id (по токенам, чтобы `ebitda` не срабатывал на `ebit`),
 * и по названию — вместе со связанной строкой рентабельности.
 * Если ничего не совпало, строка просто не скрывается.
 */
const PROFIT_MATCHERS = {
  gross: { token: 'gross', name: /валов/i },
  operating: { token: 'operating', name: /операцион/i },
  ebitda: { token: 'ebitda', name: /ebitda/i },
  ebit: { token: 'ebit', name: /\bebit\b/i },
  ebt: { token: 'ebt', name: /\bebt\b|до налогообложени/i },
}

const idTokens = (id) => String(id || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)

const matchesIndicator = (node, key) => {
  const matcher = PROFIT_MATCHERS[key]
  if (!matcher) return false
  if (idTokens(node.id).includes(matcher.token)) return true
  return matcher.name.test(node.label || '')
}

/**
 * Какие строки скрыть при текущем выборе «Показателей прибыли».
 * @param {Array}    rows       дерево строк
 * @param {string[]} selected   выбранные показатели
 * @param {string[]} available  показатели, которыми вообще управляет фильтр
 */
export const hiddenRowIdsFor = (rows = [], selected = [], available = []) => {
  const hiddenKeys = available.filter((key) => !selected.includes(key))
  if (!hiddenKeys.length) return []

  const ids = []
  const walk = (node) => {
    if (hiddenKeys.some((key) => matchesIndicator(node, key))) ids.push(node.id)
    node.children?.forEach(walk)
  }
  rows.forEach(walk)
  return ids
}

/** period из ответа → { start: 'YYYY-MM', end: 'YYYY-MM' } */
export const buildBudgetPeriod = (period, legend = []) => {
  const start = period?.start_date ? String(period.start_date).slice(0, 7) : legend[0]?.key
  const fromLegend = legend[legend.length - 1]?.key
  const end = period?.end_date ? String(period.end_date).slice(0, 7) : fromLegend
  if (!start || !end) return null
  // API отдаёт end_date как начало последнего месяца, legend — как реальный конец
  return { start, end: fromLegend && fromLegend > end ? fromLegend : end }
}

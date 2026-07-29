/**
 * Построение шапки периодов бюджета.
 *
 * ПланФакт рендерит иерархию Год → Квартал → Месяц: ярлык года и квартала
 * выводится строкой над первым месяцем своей группы и имеет кнопку сворачивания.
 * Свёрнутый год/квартал заменяет свои месяцы одной агрегирующей колонкой.
 */

/** '2026-01' → { year: 2026, month: 1 } */
export const parseMonthKey = (key) => {
  const [year, month] = key.split('-')
  return { year: parseInt(year, 10), month: parseInt(month, 10) }
}

export const quarterOfMonth = (month) => Math.floor((month - 1) / 3) + 1

export const yearKey = (year) => `y${year}`
export const quarterKey = (year, quarter) => `q${year}-${quarter}`

/** Список ключей месяцев включительно между start и end ('YYYY-MM'). */
export const listMonths = (start, end) => {
  const a = parseMonthKey(start)
  const b = parseMonthKey(end)
  const out = []
  let y = a.year
  let m = a.month
  while (y < b.year || (y === b.year && m <= b.month)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return out
}

/**
 * @param {object} p
 * @param {string} p.start  'YYYY-MM'
 * @param {string} p.end    'YYYY-MM'
 * @param {'months'|'quarters'|'years'} p.grouping
 * @param {Record<string, boolean>} p.collapsed  свёрнутые id года/квартала
 * @param {object} p.labels { total, monthShort(m,y), monthFull(m), quarter(q,y), year(y) }
 * @returns {Array} плоский список групп-колонок
 */
export const buildPeriodColumns = ({ start, end, grouping, collapsed = {}, labels }) => {
  // период ещё не загружен — таблице нечего строить
  if (!start || !end) return []
  const months = listMonths(start, end)
  const columns = [
    {
      id: 'total',
      kind: 'total',
      label: labels.total,
      months,
      head: { self: labels.total }
    }
  ]

  const monthColumn = (key, head) => {
    const { year, month } = parseMonthKey(key)
    return {
      id: key,
      kind: 'month',
      label: grouping === 'months' ? labels.monthShort(month, year) : labels.monthFull(month),
      months: [key],
      head: { ...head, self: grouping === 'months' ? labels.monthShort(month, year) : labels.monthFull(month) }
    }
  }

  if (grouping === 'months') {
    months.forEach((key) => columns.push(monthColumn(key)))
    return columns
  }

  // Группировка по годам
  const byYear = new Map()
  months.forEach((key) => {
    const { year } = parseMonthKey(key)
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year).push(key)
  })

  byYear.forEach((yearMonths, year) => {
    const yId = yearKey(year)
    const withYearHead = grouping === 'years'

    if (withYearHead && collapsed[yId]) {
      columns.push({
        id: yId,
        kind: 'year',
        label: labels.year(year),
        months: yearMonths,
        head: { self: labels.year(year), collapsedNode: { id: yId, level: 'year' } }
      })
      return
    }

    // Кварталы внутри года
    const byQuarter = new Map()
    yearMonths.forEach((key) => {
      const { month } = parseMonthKey(key)
      const q = quarterOfMonth(month)
      if (!byQuarter.has(q)) byQuarter.set(q, [])
      byQuarter.get(q).push(key)
    })

    let firstOfYear = true
    byQuarter.forEach((quarterMonths, q) => {
      const qId = quarterKey(year, q)
      const yearHead = withYearHead && firstOfYear
        ? { year: { id: yId, label: labels.year(year) } }
        : {}

      if (collapsed[qId]) {
        columns.push({
          id: qId,
          kind: 'quarter',
          label: labels.quarter(q, year),
          months: quarterMonths,
          head: { ...yearHead, self: labels.quarter(q, year), collapsedNode: { id: qId, level: 'quarter' } }
        })
        firstOfYear = false
        return
      }

      quarterMonths.forEach((key, idx) => {
        const head = {
          ...(idx === 0 ? yearHead : {}),
          ...(idx === 0 ? { quarter: { id: qId, label: labels.quarter(q, year) } } : {})
        }
        columns.push(monthColumn(key, head))
      })
      firstOfYear = false
    })
  })

  return columns
}

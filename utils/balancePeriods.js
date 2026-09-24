import moment from 'moment'

const SHORT_MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

// Сколько срезов максимум запрашиваем: при разбивке по дням длинный период
// иначе превратился бы в сотни колонок и такой же тяжёлый запрос
const MAX_CUTOFFS = 190

// Срезы (as_of) внутри периода: конец каждого дня/квартала/года + сам конец
// периода. Для 'monthly' срезы считает бэкенд (period_start_date +
// period_end_date), для 'total' срез один — конец периода.
export const buildCutoffs = (start, end, periodType) => {
  const from = moment(start)
  const to = moment(end)
  if (!from.isValid() || !to.isValid() || to.isBefore(from, 'day')) return []

  const unit = periodType === 'daily' ? 'day' : periodType === 'yearly' ? 'year' : 'quarter'
  const cutoffs = []

  let cursor = from.clone().endOf(unit)
  while (cursor.isBefore(to, 'day') && cutoffs.length < MAX_CUTOFFS) {
    cutoffs.push(cursor.format('YYYY-MM-DD'))
    cursor = cursor.add(1, 'day').endOf(unit)
  }
  cutoffs.push(to.format('YYYY-MM-DD'))

  // Период длиннее лимита — оставляем последние срезы: свежие данные нужнее
  const unique = [...new Set(cutoffs)]
  return unique.length > MAX_CUTOFFS ? unique.slice(-MAX_CUTOFFS) : unique
}

// Тело запроса для balance_report_multi — способ задания дат зависит от разбивки
export const buildPeriodPayload = (dateRange, periodType) => {
  const start = dateRange?.start ? moment(dateRange.start).format('YYYY-MM-DD') : ''
  const end = dateRange?.end ? moment(dateRange.end).format('YYYY-MM-DD') : ''

  if (!end) return {}
  if (periodType === 'total' || !start) return { as_of: end }
  if (periodType === 'monthly') return { period_start_date: start, period_end_date: end }
  // 'daily', 'quarterly', 'yearly' — срезы считаем на фронте

  return { as_of_list: buildCutoffs(start, end, periodType) }
}

// Заголовок колонки: «31 июл», а если период захватывает несколько лет — «31 июл '25»
export const formatCutoffTitle = (asOf, withYear = false) => {
  if (!asOf) return ''
  const [year, month, day] = String(asOf).split('-')
  const title = `${parseInt(day, 10)} ${SHORT_MONTHS[parseInt(month, 10) - 1]}`
  return withYear ? `${title} '${String(year).slice(-2)}` : title
}

export const buildColumns = (periods = []) => {
  const years = new Set(periods.map(p => String(p?.as_of).slice(0, 4)))
  const withYear = years.size > 1

  return periods
    .filter(p => p?.as_of)
    .map(p => ({ key: p.as_of, title: formatCutoffTitle(p.as_of, withYear) }))
}

// Срезы приходят отдельными деревьями — склеиваем их в одно дерево,
// где у каждой строки значения по всем датам: values[as_of] = value
export const mergePeriodRows = (periods = []) => {
  const columnKeys = periods.map(p => p?.as_of)

  const merge = (lists, parentPath = '') => {
    const order = []
    const byKey = new Map()

    lists.forEach((list, index) => {
      ;(list || []).forEach(node => {
        const key = node?.id ?? node?.name
        if (!byKey.has(key)) {
          byKey.set(key, {
            id: node?.id,
            name: node?.name,
            isSubtotal: node?.isSubtotal,
            values: {},
            childLists: lists.map(() => []),
          })
          order.push(key)
        }
        const entry = byKey.get(key)
        entry.values[columnKeys[index]] = node?.value ?? 0
        entry.childLists[index] = node?.children || node?.details || []
        if (!entry.name) entry.name = node?.name
      })
    })

    return order.map(key => {
      const entry = byKey.get(key)
      const uniquePath = parentPath ? `${parentPath}-${key}` : String(key)
      return {
        id: entry.id,
        uniquePath,
        name: entry.name,
        isSubtotal: entry.isSubtotal,
        values: entry.values,
        children: merge(entry.childLists, uniquePath),
      }
    })
  }

  return merge(periods.map(p => p?.data || []))
}

// Первые два уровня раскрыты по умолчанию
export const collectInitialExpanded = (rows = []) => {
  const expanded = new Set()
  rows.forEach(row => {
    if (row?.children?.length) {
      expanded.add(row.uniquePath)
      row.children.forEach(child => {
        if (child?.children?.length) expanded.add(child.uniquePath)
      })
    }
  })
  return expanded
}

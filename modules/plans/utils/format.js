/**
 * Форматирование чисел в таблице бюджета — как в ПланФакт:
 * неразрывный пробел между разрядами, типографский минус U+2212,
 * «н/о» когда показатель не определён.
 */

const NBSP = ' '
const MINUS = '−'

const groupDigits = (abs) =>
  new Intl.NumberFormat('ru-RU').format(abs).replace(/[\s ]/g, NBSP)

/** Денежное значение. null/undefined → пустая ячейка. */
export const formatMoney = (value) => {
  if (value == null || Number.isNaN(value)) return ''
  const rounded = Math.round(value)
  if (rounded === 0) return '0'
  const formatted = groupDigits(Math.abs(rounded))
  return rounded < 0 ? `${MINUS}${formatted}` : formatted
}

/** Денежное значение со знаком (колонка «Откл.»). */
export const formatDeviation = (value) => {
  if (value == null || Number.isNaN(value)) return ''
  const rounded = Math.round(value)
  if (rounded === 0) return '0'
  const formatted = groupDigits(Math.abs(rounded))
  return rounded < 0 ? `${MINUS}${formatted}` : `+${formatted}`
}

/** Процент. undefined → «н/о». */
export const formatPercent = (value, naLabel = 'н/о') => {
  if (value == null || !Number.isFinite(value)) return naLabel
  const rounded = Math.round(value)
  if (rounded === 0) return '0%'
  return rounded < 0 ? `${MINUS}${Math.abs(rounded)}%` : `${rounded}%`
}

/**
 * Значение для колонки «Вып. плана, %» — `plan.profit_percentage`
 * из get_budget_plan: факт / план × 100.
 * (Формула сверена с ответом API: план 500 000, факт 100 000 → 20 %.)
 * Как и на бэке, нулевой делитель даёт 0, а не «н/о».
 */
export const planExecution = (plan, fact) => {
  if (!plan) return 0
  return ((fact || 0) / plan) * 100
}

/**
 * Значение для колонки «Откл.» — `plan.profit` из get_budget_plan:
 *   profit = факт − план (знак сохраняем как есть).
 * (Сверено с API: план 500, факт 5 000 → profit 4 500.)
 */
export const deviation = (plan, fact) => (fact || 0) - (plan || 0)

/**
 * Значение для колонки «Откл., %» — `plan.distinction_percentage`:
 *   (факт − план) / план × 100, то есть отклонение в долях плана.
 * (Сверено с API: план 500, факт 5 000 → profit 4 500 → 900 %.)
 * Считаем по той же формуле, а не берём поле напрямую, чтобы значение
 * совпадало и в свёрнутых периодах, и сразу после правки плана — до
 * перезапроса дерева. Нулевой делитель, как и на бэке, даёт 0.
 */
export const deviationPercent = (plan, fact) => {
  if (!plan) return 0
  return (deviation(plan, fact) / plan) * 100
}

/** Разбор пользовательского ввода в редактируемой ячейке плана. */
export const parseInputNumber = (text) => {
  const cleaned = String(text).replace(/[^\d,.\-−]/g, '').replace(/[−]/g, '-').replace(',', '.')
  if (!cleaned || cleaned === '-') return null
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : null
}

/** Значение в редактируемом инпуте (без неразрывных пробелов — их не любит caret). */
export const toInputValue = (value) => {
  if (value == null || Number.isNaN(value)) return ''
  return String(Math.round(value))
}

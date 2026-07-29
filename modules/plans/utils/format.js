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
 * Значение для колонки «Вып. плана, %» — `plan.profit_percentage`:
 *   profit_percentage = план / факт × 100.
 */
export const planExecution = (plan, fact) => {
  if (!fact) return null
  return ((plan || 0) / fact) * 100
}

/**
 * Значение для колонки «Откл.» — `plan.profit` из get_budget_plan:
 *   profit = план − факт (знак сохраняем как есть).
 */
export const deviation = (plan, fact) => (plan || 0) - (fact || 0)

/**
 * Значение для колонки «Откл., %» — `plan.distinction_percentage`:
 *   distinction = план / (план − факт) × 100.
 * Считаем по той же формуле, чтобы значение совпадало и в свёрнутых периодах,
 * и сразу после правки плана — до перезапроса дерева.
 */
export const deviationPercent = (plan, fact) => {
  const diff = deviation(plan, fact)
  if (!diff) return null
  return ((plan || 0) / diff) * 100
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

import { isShowCents } from '@/utils/helpers'

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
 * Значение для колонки «Откл.» — `plan.profit` из get_budget_plan, как приходит.
 * Знак задаёт бэк и он зависит от строки: в доходных это «факт − план»
 * (план 500, факт 5 000 → +4 500), в расходных «план − факт»
 * (план 0, факт 4 136 → −4 136). Поэтому поле берём как есть, а не считаем.
 * Свой расчёт остаётся только для строк, которых нет в ответе API.
 */
export const deviation = (metrics) => {
  if (!metrics) return 0
  if (metrics.profit != null) return metrics.profit
  return (metrics.fact || 0) - (metrics.plan || 0)
}

/**
 * Значение для колонки «Откл., %» — `plan.distinction_percentage`:
 *   profit / план × 100, то есть отклонение в долях плана.
 * (Сверено с API: план 500, факт 5 000 → profit 4 500 → 900 %.)
 * Считаем из profit, а не берём поле напрямую: у месяцев и итога периода
 * оно приходит с разным знаком, и так значение совпадает в свёрнутых
 * периодах и сразу после правки плана. Нулевой делитель, как и на бэке, даёт 0.
 */
export const deviationPercent = (metrics) => {
  const plan = metrics?.plan
  if (!plan) return 0
  return (deviation(metrics) / plan) * 100
}

/**
 * Разбор пользовательского ввода в редактируемой ячейке плана.
 * «б» и «ю» — это клавиши «,» и «.» английской раскладки: в русской раскладке
 * дробную часть набирают именно ими, поэтому считаем их разделителем. Без этого
 * буквы просто вырезались и «2ю5» превращалось в 25.
 */
export const parseInputNumber = (text) => {
  const cleaned = String(text)
    .replace(/[бБюЮ]/g, '.')
    .replace(/[^\d,.\-−]/g, '')
    .replace(/[−]/g, '-')
    .replace(',', '.')
  if (!cleaned || cleaned === '-') return null
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : null
}

/** Значение в редактируемом инпуте (без неразрывных пробелов — их не любит caret). */
export const toInputValue = (value) => {
  if (value == null || Number.isNaN(value)) return ''
  return String(Math.round(value))
}

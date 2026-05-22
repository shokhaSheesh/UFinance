// utils/operationsUtils.js
import { formatDate } from '@/utils/formatDate'

/**
 * Safely converts any date value to a formatted string.
 * Returns undefined if the value is missing or invalid.
 */
export function safeFormatDate(date) {
  if (!date) return undefined
  try {
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return undefined
    return formatDate(d)
  } catch {
    return undefined
  }
}

/**
 * Converts the categorised operation lists into a single flat array
 * with sentinel `{ type: 'header' }` items for section dividers.
 * This is the data source for the virtualizer.
 *
 * @param {{ future: any[], today: any[], before: any[] }} operationsList
 * @param {Function} t - next-intl translation function
 * @returns {Array<{ type: 'header', label: string } | { type: 'row', op: any }>}
 */
export function buildFlatItems(operationsList, t) {
  const items = []

  if (operationsList.future.length > 0) {
    items.push(...operationsList.future.map(op => ({ type: 'row', op })))
  }

  if (operationsList.today.length > 0) {
    items.push({ type: 'header', label: t('page.sectionToday') })
    items.push(...operationsList.today.map(op => ({ type: 'row', op })))
  }

  if (operationsList.before.length > 0) {
    items.push({ type: 'header', label: t('page.sectionBefore') })
    items.push(...operationsList.before.map(op => ({ type: 'row', op })))
  }

  return items
}
/**
 * Разбор ответов get_counterparties_debitorka / get_counterparties_kreditorka
 * и форматирование сумм для блока «Долги».
 *
 * Ответ приходит в виде
 *   data.data = {
 *     data: [{ guid, nazvanie, kreditorka, expired_kreditorka }, ...],
 *     total_kreditorka, total_expired_kreditorka, display_currency_code
 *   }
 * (у дебиторки — те же поля с `debitorka`). Эти имена стоят первыми в списках
 * ключей ниже; остальные оставлены как запасные варианты. Весь маппинг собран
 * здесь — при изменениях на бэке правится только он.
 */

const NAME_KEYS = [
  'nazvanie',
  'name',
  'counterparties_name',
  'counterparty_name',
  'partner_name',
  'title',
  'polnoe_imya',
]

// итог по всему списку (корень ответа) и сумма по одному контрагенту
const TOTAL_KEYS = [
  'total_debitorka',
  'total_kreditorka',
  'debitorka',
  'kreditorka',
  'summa',
  'total',
  'total_summa',
  'amount',
  'debt',
]

// просроченная часть: total_* — в корне ответа, expired_* — у контрагента
const EXPIRED_KEYS = [
  'total_expired_debitorka',
  'total_expired_kreditorka',
  'expired_debitorka',
  'expired_kreditorka',
  'expired',
  'expired_summa',
  'expired_sum',
  'expired_amount',
  'overdue',
  'overdue_summa',
]

const readNumber = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key]
    if (value === undefined || value === null || value === '') continue
    const num = Number(value)
    if (!Number.isNaN(num)) return num
  }
  return 0
}

const readString = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

/** Достаёт массив контрагентов из ответа независимо от того, во что он завёрнут */
const readList = (root) => {
  if (Array.isArray(root)) return root
  const candidates = [root?.items, root?.counterparties, root?.data, root?.list, root?.result]
  return candidates.find(Array.isArray) || []
}

/**
 * @returns {{ items: Array<{guid: string, name: string, total: number, expired: number}>,
 *             total: number, expired: number }}
 */
export const readDebtsResponse = (res, fallbackName = '') => {
  const root = res?.data?.data ?? res?.data ?? res
  const list = readList(root)

  const items = list.map((item, index) => {
    const expiredRaw = readNumber(item, EXPIRED_KEYS)
    // если общей суммы в строке нет, считаем её равной просроченной — иначе
    // полоса схлопнулась бы в ноль
    const total = readNumber(item, TOTAL_KEYS) || expiredRaw
    return {
      guid: item?.guid || item?.counterparties_id || `debt-${index}`,
      name: readString(item, NAME_KEYS) || fallbackName,
      total,
      // просроченная часть не может превышать общую сумму долга
      expired: Math.min(Math.abs(expiredRaw), Math.abs(total)) * (total < 0 ? -1 : 1),
    }
  })

  const sumBy = (field) => items.reduce((acc, item) => acc + (item[field] || 0), 0)
  // итоги берём с бэка, если он их прислал — иначе считаем по списку
  const total = Array.isArray(root) ? sumBy('total') : readNumber(root, TOTAL_KEYS) || sumBy('total')
  const expired = Array.isArray(root)
    ? sumBy('expired')
    : readNumber(root, EXPIRED_KEYS) || sumBy('expired')

  return { items, total, expired }
}

/**
 * Сортировка по убыванию — всегда на клиенте: бэкенд списки не сортирует.
 * При равных суммах порядок доопределяем второй суммой и названием, иначе
 * строки скачут между перерисовками.
 * @param {'total'|'expired'} sort — по общей или по просроченной сумме
 */
export const sortDebts = (items, sort) => {
  const field = sort === 'total' ? 'total' : 'expired'
  const other = field === 'total' ? 'expired' : 'total'
  return [...items].sort(
    (a, b) =>
      Math.abs(b[field]) - Math.abs(a[field]) ||
      Math.abs(b[other]) - Math.abs(a[other]) ||
      a.name.localeCompare(b.name, 'ru')
  )
}

/**
 * Формат суммы с учётом настройки разрядности:
 * 'none' — как есть (до 2 знаков после запятой), иначе сумма делится на 10^N.
 */
export const formatDebtValue = (value, rounding) => {
  const num = Number(value) || 0
  if (rounding && rounding !== 'none') {
    const factor = 10 ** Number(rounding)
    return Math.round(num / factor).toLocaleString('ru-RU')
  }
  return num.toLocaleString('ru-RU', { maximumFractionDigits: 2 })
}

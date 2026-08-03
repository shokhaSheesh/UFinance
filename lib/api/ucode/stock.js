import { apiClient } from './base'

/**
 * ============================================
 * Остатки склада
 * ============================================
 */

/**
 * `get_stock_count` → доступный остаток. Значение лежит в data.data.quantity,
 * но уровней вложенности `data` в конверте может быть разное число, поэтому
 * ищем поле `quantity` защитно на любой глубине ответа.
 */
export const readStockCount = (res) => {
  const seen = new Set()
  const find = (obj) => {
    if (!obj || typeof obj !== 'object' || seen.has(obj)) return undefined
    seen.add(obj)
    if (obj.quantity != null && !Number.isNaN(Number(obj.quantity))) {
      return Number(obj.quantity)
    }
    for (const key of Object.keys(obj)) {
      const found = find(obj[key])
      if (found != null) return found
    }
    return undefined
  }
  return find(res) ?? 0
}

/** Доступный остаток товара на складе на дату. */
export const getStockCount = async ({ productId, warehouseId, date }) => {
  const res = await apiClient.invokeFunction({
    method: 'get_stock_count',
    data: {
      product_and_service_id: productId,
      warehouse_id: warehouseId,
      date,
    },
  })
  return readStockCount(res)
}

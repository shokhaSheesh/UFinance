import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { useMemo } from 'react'

// Позиций на одном складе обычно немного; берём одной страницей, чтобы
// собрать полный список товаров для пикера
const LIMIT = 500

/**
 * Товары, которые сейчас лежат на складе (`list_stock_balances`).
 * Нужен, чтобы в перемещении предлагать только позиции этого склада, а не
 * весь каталог.
 *
 * Отдаём id обоих видов (`product_and_service_id` и `guid` строки остатка):
 * какой из них совпадёт с каталогом — зависит от метода, а пикер сверяет оба.
 * Остаток для колонки берётся отдельно (`get_stock_count`) — он считается на
 * дату документа, а здесь лежит текущий.
 */
export function useWarehouseStockProducts(warehouseId, { skip = false } = {}) {
  const { data, isLoading, isFetching } = useUcodeRequestQuery({
    queryKey: 'list_stock_balances_products',
    method: 'list_stock_balances',
    data: { warehouse_id: warehouseId, page: 1, limit: LIMIT },
    skip: skip || !warehouseId,
    querySetting: {
      select: (res) => (Array.isArray(res?.data?.data) ? res.data.data : []),
    },
  })

  // Перемещать можно только то, что доступно: зарезервированное «ожидание»
  // склад ещё не отпустил
  const productIds = useMemo(() => {
    const ids = new Set()
    ;(data || []).forEach((row) => {
      if (!((Number(row?.quantity) || 0) > 0)) return
      const candidates = [
        row?.product_and_service_id,
        row?.products_and_services_id,
        row?.product_id,
        row?.guid,
      ]
      candidates.filter(Boolean).forEach((id) => ids.add(id))
    })
    return ids
  }, [data])

  return { productIds, isLoading: isLoading || isFetching }
}

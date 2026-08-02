import { ucodeRequest } from './base'

/**
 * Warehouse (Склады) API
 *
 * The backend envelope uses a lowercase `status: "error"` for failures
 * (unlike most other planfact methods, which use `status: "ERROR"`), so
 * `apiClient.handleResponse` — which only checks the uppercase variants —
 * would otherwise pass a failed warehouse call through as a "successful"
 * response. `warehouseRequest` catches that case explicitly so mutations
 * reliably reject (and show the real backend message) on failure, e.g.
 * `delete_warehouse` returning "this object is used and you can't delete it".
 */
async function warehouseRequest(method, data = {}) {
  const res = await ucodeRequest({ method, data })
  const status = res?.status
  if (status === 'error' || status === 'ERROR') {
    const message = res?.data?.message || res?.data?.error || 'Ошибка при выполнении запроса'
    throw new Error(message)
  }
  return res
}

/**
 * Список складов текущего филиала
 * @param {Object} params
 * @param {string} [params.branch_id] - Переопределить филиал (по умолчанию — из токена)
 */
export const listWarehouses = (params = {}) => warehouseRequest('list_warehouses', params)

/**
 * Получить склад по guid
 * @param {string} guid
 */
export const getWarehouseByGuid = (guid) => warehouseRequest('get_warehouse_by_id', { guid })

/**
 * Создать склад
 * @param {Object} data
 * @param {string} data.name - Название склада (обязательно)
 * @param {string} [data.address]
 * @param {string} [data.comment]
 * @param {boolean} [data.is_default]
 * @param {string} [data.branch_id]
 */
export const createWarehouse = (data) => warehouseRequest('create_warehouse', data)

/**
 * Обновить склад (только переданные поля)
 * @param {Object} data
 * @param {string} data.guid - Обязательно
 */
export const updateWarehouse = (data) => warehouseRequest('update_warehouse', data)

/**
 * Удалить склад. Бросает ошибку, если на складе есть остатки/движения.
 * @param {string} guid
 */
export const deleteWarehouse = (guid) => warehouseRequest('delete_warehouse', { guid })

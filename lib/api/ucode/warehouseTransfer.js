import { ucodeRequest } from './base'

/**
 * Перемещение товара между складами (`warehouse_transfers`).
 *
 * Одно подтверждение создаёт: сам документ, одно «Начисление»
 * (дебет — статья склада-получателя, кредит — статья склада-отправителя),
 * строки `product_and_service`, и по два движения остатков на строку
 * (`out` со склада-отправителя, `in` на склад-получатель).
 *
 * Перемещение не создаёт и не теряет стоимость: строка оценивается по средней
 * себестоимости склада-отправителя, поэтому цены с фронта не отправляются,
 * а документ всегда ведётся в UZS (валюту слать не нужно).
 *
 * Как и остальные складские хендлеры, эти методы отвечают строчным
 * `status: 'error'` (а не 'ERROR', который ловит `apiClient.handleResponse`),
 * плюс кладут `success: false` внутрь `data` — оба случая разворачиваем в
 * throw, чтобы мутации реально падали и показывали сообщение бэка.
 */
async function transferRequest(method, data = {}) {
  const res = await ucodeRequest({ method, data })
  const payload = res?.data
  if (res?.status === 'error' || res?.status === 'ERROR' || payload?.success === false) {
    const message = payload?.message || payload?.error || 'Ошибка при выполнении запроса'
    throw new Error(message)
  }
  // { success: true, data: ..., pagination?: {...} }
  return payload
}

/**
 * Создать перемещение.
 * @param {Object} data
 * @param {string} data.from_warehouse_id - Склад-отправитель (обязательно)
 * @param {string} data.to_warehouse_id   - Склад-получатель (обязательно, отличается от отправителя)
 * @param {Array}  data.product_and_service_data - Строки: { product_and_service_id, Kol_vo > 0 }
 * @param {string} [data.transfer_date]   - YYYY-MM-DD, по умолчанию сегодня
 * @param {string} [data.description]
 * @param {string} [data.legal_entity_id]
 * @param {string} [data.projects_id]     - Завершённый проект бэк отклоняет
 */
export const createWarehouseTransfer = (data) =>
  transferRequest('create_warehouse_transfer', data)

/** Одно перемещение со строками. */
export const getWarehouseTransfer = (guid) =>
  transferRequest('get_warehouse_transfer', { guid })

/**
 * История перемещений (сортировка: transfer_date DESC, created_at DESC).
 * @param {Object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20] - максимум 500
 * @param {string} [params.search]
 * @param {string} [params.warehouse_id] - склад с любой из двух сторон
 * @param {string} [params.from_warehouse_id]
 * @param {string} [params.to_warehouse_id]
 * @param {string} [params.date_from]
 * @param {string} [params.date_to]
 */
export const listWarehouseTransfers = (params = {}) =>
  transferRequest('list_warehouse_transfers', params)

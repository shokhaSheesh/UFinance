/**
 * Проверка остатков перед закрытием планового документа склада.
 * Закрытие исполняет документ, поэтому товар должен быть на складе уже сейчас.
 */

/**
 * Списывает ли закрытие документа товар со склада.
 * Расходная накладная (отгрузка покупателю) и возврат поставщику — списывают;
 * приёмка (GRN) и возврат от покупателя, наоборот, приходуют.
 *
 * @param {'shipment'|'supply'} type
 * @param {boolean} isReturn возврат (у документа отрицательная сумма)
 */
export const isStockOutflow = (type, isReturn) =>
  type === 'supply' ? !!isReturn : !isReturn

/**
 * Услуги склад не расходуют. Тип известен не всегда — тогда позицию считаем
 * товаром: лучше проверить остаток, чем молча пропустить проверку.
 */
export const isServiceRow = row =>
  (row?.Tip || row?.tip || row?.product_and_service_id_data?.Tip) === 'service'

/**
 * Позиции документа → сколько товара уходит со склада.
 * Одинаковые товары в разных строках складываем; у возвратов количества
 * приходят со знаком минус, поэтому берём модуль.
 *
 * @returns {Map<string, {name: string, requested: number}>}
 */
export const collectRequested = (products = []) => {
  const map = new Map()
  products.forEach(row => {
    const productId = row?.product_and_service_id
    if (!productId || isServiceRow(row)) return
    const qty = Math.abs(Number(row?.Kol_vo) || 0)
    if (!qty) return
    const current = map.get(productId)
    map.set(productId, {
      name: row?.Naimenovanie || row?.Artikul || '',
      requested: (current?.requested || 0) + qty,
    })
  })
  return map
}

/**
 * Товары, которых не хватает на складе.
 *
 * @param {Map} requested         результат collectRequested
 * @param {object} availableByProduct  product_and_service_id → доступный остаток
 */
export const findShortages = (requested, availableByProduct = {}) => {
  const out = []
  requested.forEach(({ name, requested: needed }, productId) => {
    const available = availableByProduct[productId]
    if (available == null || needed <= available) return
    out.push({ productId, name, requested: needed, available })
  })
  return out
}

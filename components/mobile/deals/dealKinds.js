/**
 * Продажа и закупка на телефоне — один экран, разные методы API.
 *
 * На большом экране это две страницы по 700–800 строк, которые расходятся
 * в названиях методов, полей и подписей. Здесь вся разница собрана в одном
 * месте: экран берёт описание вида сделки и не ветвится по коду.
 */

export const DEAL_KINDS = {
  sale: {
    key: 'sale',
    listMethod: 'get_sales_list_simple',
    getMethod: 'get_sales_transaction_by_guid',
    createMethod: 'create_sales_transaction',
    updateMethod: 'update_sales_transaction',
    deleteMethod: 'delete_sales_transaction',
    statusMethod: 'update_sales_transaction',
    // поле сделки в товарах, операциях и комментариях
    productsField: 'sales_transactions_id',
    operationField: 'sales_transactions_id',
    commentsVariant: 'sale',
    actField: 'sales_transaction_id',
    // документы движения товара: отгрузки клиенту
    shipment: {
      listMethod: 'list_sales_operations',
      listField: 'sales_transaction_id',
      listTab: 'shipment',
      dealField: 'sales_id',
      getMethod: 'get_shipment_transaction',
      createMethod: 'create_shipment_transaction',
      updateMethod: 'update_shipment_transaction',
      deleteMethod: 'delete_shipment_transaction',
      operationType: ['Отгрузка'],
      articleTypes: ['Доходы', 'Актив', 'Обязательства'],
      plannedField: 'planned_shipment',
      permission: 'shipment',
    },
    invalidate: ['get_sales_list_simple', 'get_sales_transaction_by_guid', 'list_sales_operations'],
    detailHref: (guid) => `/m/deals/${guid}`,
    listHref: '/m/deals',
  },
  purchase: {
    key: 'purchase',
    listMethod: 'get_purchase_list',
    getMethod: 'get_purchase_transaction_by_guid',
    createMethod: 'create_purchase_transaction',
    updateMethod: 'update_purchase_transaction',
    deleteMethod: 'delete_purchase_transaction',
    statusMethod: 'update_purchase_transaction_status',
    productsField: 'purchase_transactions_id',
    operationField: 'purchase_transactions_id',
    commentsVariant: 'purchase',
    actField: 'purchase_transactions_id',
    // поставки от поставщика
    shipment: {
      listMethod: 'list_purchase_operations',
      listField: 'purchase_transactions_id',
      listTab: null,
      dealField: 'purchase_transactions_id',
      getMethod: 'get_supply_transaction',
      createMethod: 'create_supply_transaction',
      updateMethod: 'update_supply_transaction',
      deleteMethod: 'delete_supply_transaction',
      operationType: ['Поставка'],
      articleTypes: ['Расходы', 'Актив', 'Обязательства'],
      plannedField: 'planned_supply',
      permission: 'supply',
    },
    invalidate: ['get_purchase_list', 'get_purchase_transaction_by_guid', 'list_purchase_operations'],
    detailHref: (guid) => `/m/purchases/${guid}`,
    listHref: '/m/deals?kind=purchase',
  },
}

/**
 * Цифры сделки в одном виде. Ответы продажи и закупки называют одно и то
 * же по-разному (total_products_summa / deal_sum, client_debt / разница).
 */
export const readDealFigures = (kind, deal, accounting) => {
  if (!deal) return null

  if (kind === 'purchase') {
    const amount = Number(deal.deal_sum) || 0
    const paid = Number(deal.paid_amount) || 0
    const moved = Number(deal.supply_amount) || 0
    return {
      amount,
      paid,
      moved,
      paidPercent: deal.paid_percent != null ? Math.round(deal.paid_percent) : percentOf(paid, amount),
      movedPercent: deal.supply_percent != null ? Math.round(deal.supply_percent) : percentOf(moved, amount),
      debt: amount - paid,
      remaining: amount - moved,
      counterpartyName: deal.counterparty_name,
      date: deal.deal_date,
      status: deal.sales_status_name,
    }
  }

  const amount = Number(deal.total_products_summa) || 0
  const paid = Number(deal.total_receipts_summa) || 0
  const moved = Number(deal.total_shipment_summa) || 0
  const method = accounting === 'accrual' ? deal.accrual_method : deal.cash_method
  return {
    amount,
    paid,
    moved,
    paidPercent: percentOf(paid, amount),
    movedPercent: percentOf(moved, amount),
    debt: Number(deal.client_debt) || 0,
    remaining: Number(deal.remaining_shipment) || 0,
    counterpartyName: deal.counterparties_name,
    date: deal.sale_date,
    status: Array.isArray(deal.status) ? deal.status[0] : deal.status?.name || deal.status,
    profit: Number(method?.profit) || 0,
    profitability: Math.round(Number(method?.profitability)) || 0,
    income: Number(method?.income) || 0,
    expenses: Number(method?.expenses) || 0,
    counts: {
      products: deal.products_count,
      receipts: deal.receipts_count,
      expenses: deal.expenses_count,
      shipments: deal.shipments_count,
    },
  }
}

const percentOf = (value, total) => (total ? Math.round((Math.abs(value) / Math.abs(total)) * 100) : 0)

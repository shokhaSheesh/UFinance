// Разделы из list_action_history (table_slug). Порядок — как в документации API
export const TABLE_SLUGS = [
  'operations',
  'chart_of_accounts',
  'counterparties',
  'counterparties_group',
  'legal_entity',
  'my_accounts',
  'account_groups',
  'product_and_service',
  'group_product_and_service',
  'sales_status',
  'sales_transactions',
  'purchase_transactions',
  'warehouse',
  'stock_balances',
  'stock_movements',
  'stock_balance_histories',
  'warehouse_transfers',
  'project_groups',
  'projects',
  'budgets',
  'budget_plans',
]

export const ACTIONS = ['create', 'update', 'delete']

// Цвет бейджа по типу действия
export const ACTION_STYLES = {
  create: 'bg-green-50 text-green-700 border-green-200',
  update: 'bg-blue-50 text-blue-700 border-blue-200',
  delete: 'bg-red-50 text-red-700 border-red-200',
}

export const PAGE_LIMIT = 20

// Бэк отдаёт событие одной строкой: «Добавлено юрлицо — название: …, ИНН: …».
// До тире — что произошло, после — перечень полей записи. Разводим их по
// разным строкам, иначе длинный список полей забивает саму суть события
export const splitEvent = event => {
  const text = String(event || '').trim()
  const dashIndex = text.indexOf('\u2014')
  if (dashIndex === -1) return { title: text, details: '' }
  return {
    title: text.slice(0, dashIndex).trim(),
    details: text.slice(dashIndex + 1).trim(),
  }
}

// Детали — это перечень «поле: значение» через запятую. Режем только перед
// началом следующей пары, иначе запятая внутри самого значения (например
// в названии контрагента) разорвала бы его пополам
export const splitDetails = details => {
  const text = String(details || '').trim()
  if (!text) return []
  return text
    .split(/,\s+(?=[^,:]+:\s)/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const match = part.match(/^([^:]+):\s*([\s\S]*)$/)
      if (!match) return { label: '', value: part }
      return { label: match[1].trim(), value: match[2].trim() || '-' }
    })
}

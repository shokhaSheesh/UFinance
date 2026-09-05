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

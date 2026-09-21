'use client'

import BudgetListPage from '@/modules/plans/components/BudgetListPage'

// Бюджет доходов и расходов (БДР) — общий список бюджетов с типом `pnl`
const IncomeExpenseBudget = () => (
  <BudgetListPage
    type="pnl"
    listNamespace="Plans.incomeExpenseBudget"
    singleNamespace="Plans.IncomeExpenseBudgetSingle"
    basePath="/income_expense_budget"
  />
)

export default IncomeExpenseBudget

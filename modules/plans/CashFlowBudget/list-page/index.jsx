'use client'

import BudgetListPage from '@/modules/plans/components/BudgetListPage'

// Бюджет движения денег (БДДС) — общий список бюджетов с типом `cashflow`
const CashFlowBudget = () => (
  <BudgetListPage
    type="cashflow"
    listNamespace="Plans.cashFlowBudget"
    singleNamespace="Plans.CashFlowBudgetSingle"
    basePath="/cash_flow_budget"
  />
)

export default CashFlowBudget

'use client'

import { balanceStore } from '@/components/reports/balance/balance.store'
import { cashFlowStore } from '@/components/reports/cashflow/cashflow.store'
import { pnlStore } from '@/components/reports/profit-and-loss/pnl.store'

/**
 * Сколько фильтров сейчас включено в отчёте.
 *
 * Считается в одном месте, чтобы число на кнопке «Фильтры» и число в шапке
 * самой панели не разъезжались: раньше счёт жил внутри панели, и страница
 * до него не дотягивалась — кнопка стояла без бейджа, и по закрытой панели
 * было не понять, что отчёт отфильтрован.
 *
 * Даты сравниваем нормализованно: в сторах лежат то строки, то Date.
 */
const datesEqual = (a, b) =>
  a && b ? new Date(a).toDateString() === new Date(b).toDateString() : a === b

const len = (value) => (Array.isArray(value) ? value.length : 0)

export function useCashFlowFilterCount() {
  const { periodStartDate, periodEndDate, sellingDealId, contrAgentId, accountId, projectId, defaultDate } =
    cashFlowStore

  return (
    (!datesEqual(periodStartDate, defaultDate?.start) || !datesEqual(periodEndDate, defaultDate?.end) ? 1 : 0) +
    len(accountId) +
    len(contrAgentId) +
    len(projectId) +
    len(sellingDealId)
  )
}

export function usePnLFilterCount() {
  const {
    dateRange,
    defaultDate,
    selectedAccounts,
    selectedCounterparties,
    selectedProjects,
    deals,
    selectedLegalEntities,
    operational,
    ebitda,
    ebit,
    ebt,
  } = pnlStore

  return (
    (!datesEqual(dateRange?.start, defaultDate?.start) || !datesEqual(dateRange?.end, defaultDate?.end) ? 1 : 0) +
    len(selectedAccounts) +
    len(selectedCounterparties) +
    len(selectedProjects) +
    len(deals) +
    len(selectedLegalEntities) +
    (operational || ebitda || ebit || ebt ? 1 : 0)
  )
}

export function useBalanceFilterCount() {
  const { dateRange, defaultDate, selectedAccount, selectedCounterparties } = balanceStore

  return (
    (!datesEqual(dateRange?.start, defaultDate?.start) || !datesEqual(dateRange?.end, defaultDate?.end) ? 1 : 0) +
    len(selectedAccount) +
    len(selectedCounterparties)
  )
}

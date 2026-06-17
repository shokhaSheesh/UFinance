// hooks/useOperationsFilters.js
import { appStore } from '@/store/app.store'
import { operationFilterStore } from '@/store/operationFilter.store'
import { toJS } from 'mobx'
import { useEffect, useMemo, useState } from 'react'
import { safeFormatDate } from '../utils/operationsUtils'

const LIMIT = 50

/**
 * Builds and double-debounces operation request filters.
 * - Inner debounce: syncs store's debouncedSearchQuery (500ms)
 * - Outer debounce: delays the actual API request filters (1000ms)
 *
 * Returns { requestOperationFilters }
 */
export function useOperationsFilters() {
  const {
    searchQuery,
    debouncedSearchQuery,
    selectedDatePaymentRange,
    selectedDateStartRange,
    selectedCounterAgents,
    selectedLegalEntities,
    selectedFilters,
    amountRange,
    selectedChartOfAccounts,
    paymentType,
    deals,
    paymentConfirm,
    paymentNotConfirm,
    accrualConfirm,
    accrualNotConfirm,
  } = operationFilterStore

  // Inner debounce: keep store's debouncedSearchQuery in sync
  useEffect(() => {
    const timer = setTimeout(() => {
      operationFilterStore.setDebouncedSearchQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const paymentStartDate = safeFormatDate(selectedDatePaymentRange?.start)
  const paymentEndDate   = safeFormatDate(selectedDatePaymentRange?.end)
  const accrualStartDate = safeFormatDate(selectedDateStartRange?.start)
  const accrualEndDate   = safeFormatDate(selectedDateStartRange?.end)

  const immediateFilters = useMemo(() => ({
    limit:                LIMIT,
    search:               debouncedSearchQuery.toLowerCase(),
    paymentDateStart:     paymentStartDate,
    paymentDateEnd:       paymentEndDate,
    accrualDateStart:     accrualStartDate,
    accrualDateEnd:       accrualEndDate,
    counterparties_ids:   toJS(selectedCounterAgents),
    my_accounts_ids:      toJS(selectedLegalEntities),
    tip:                  toJS(selectedFilters),
    amount_range:         { min: Number(amountRange.min), max: Number(amountRange.max) },
    chart_of_accounts_ids: toJS(selectedChartOfAccounts),
    payment_type:         appStore.isPayment ? paymentType : null,
    paymentConfirm,
    paymentNotConfirm,
    accrualConfirm,
    accrualNotConfirm,
    selling_deal_ids: deals,
  }), [
    debouncedSearchQuery, paymentStartDate, paymentEndDate,
    accrualStartDate, accrualEndDate, selectedCounterAgents,
    selectedLegalEntities, selectedFilters, amountRange,
    selectedChartOfAccounts, paymentType,
    paymentConfirm, paymentNotConfirm, accrualConfirm, accrualNotConfirm, deals,
  ])

  // Outer debounce: delays actual request (1 second)
  const [requestOperationFilters, setRequestOperationFilters] = useState(immediateFilters)

  useEffect(() => {
    const timer = setTimeout(() => setRequestOperationFilters(immediateFilters), 1000)
    return () => clearTimeout(timer)
  }, [immediateFilters])

  return { requestOperationFilters }
}
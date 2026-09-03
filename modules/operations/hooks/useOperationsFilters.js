// hooks/useOperationsFilters.js
import { appStore } from '@/store/app.store'
import { operationFilterStore } from '@/store/operationFilter.store'
import { StringtoNumber } from '@/utils/helpers'
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
    selectedProjects,
    selectedFilters,
    amountRange,
    selectedChartOfAccounts,
    paymentType,
    deals,
    purchaseDeals,
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

  // Фильтр «Дата начисления» скрыт, пока выключена настройка
  // show_accrual_date_filter. Скрытый фильтр не должен молча сужать выборку,
  // поэтому сохранённые значения в запрос не уходят.
  const accrualFilterVisible = Boolean(appStore.interfaceSettings?.showAccrualDateFilter)

  const paymentStartDate = safeFormatDate(selectedDatePaymentRange?.start)
  const paymentEndDate   = safeFormatDate(selectedDatePaymentRange?.end)
  const accrualStartDate = accrualFilterVisible ? safeFormatDate(selectedDateStartRange?.start) : null
  const accrualEndDate   = accrualFilterVisible ? safeFormatDate(selectedDateStartRange?.end) : null
  const accrualConfirmValue    = accrualFilterVisible ? accrualConfirm : true
  const accrualNotConfirmValue = accrualFilterVisible ? accrualNotConfirm : true

  const immediateFilters = useMemo(() => ({
    limit:                LIMIT,
    search:               debouncedSearchQuery.toLowerCase(),
    paymentDateStart:     paymentStartDate,
    paymentDateEnd:       paymentEndDate,
    accrualDateStart:     accrualStartDate,
    accrualDateEnd:       accrualEndDate,
    counterparties_ids:   toJS(selectedCounterAgents),
    my_accounts_ids:      toJS(selectedLegalEntities),
    project_ids:         toJS(selectedProjects),
    tip:                  toJS(selectedFilters),
    // сумма приходит из фильтра с пробелами между разрядами («1 234.56»),
    // поэтому разбираем её, а не приводим Number-ом — иначе NaN
    amount_range:         { min: Number(StringtoNumber(amountRange.min)) || 0, max: Number(StringtoNumber(amountRange.max)) || 0 },
    chart_of_accounts_ids: toJS(selectedChartOfAccounts),
    payment_type:         appStore.isPayment ? paymentType : null,
    paymentConfirm,
    paymentNotConfirm,
    accrualConfirm:       accrualConfirmValue,
    accrualNotConfirm:    accrualNotConfirmValue,
    sellingDealId:        deals,
    purchaseDealId:       purchaseDeals,
    currency_guid:        appStore.currency?.guid,
  }), [
    debouncedSearchQuery, paymentStartDate, paymentEndDate,
    accrualStartDate, accrualEndDate, selectedCounterAgents,
    selectedLegalEntities, selectedProjects, selectedFilters, amountRange,
    selectedChartOfAccounts, paymentType,
    paymentConfirm, paymentNotConfirm, accrualConfirmValue, accrualNotConfirmValue, deals, purchaseDeals,
    appStore.currency?.guid,
  ])

  // Outer debounce: delays actual request (1 second)
  const [requestOperationFilters, setRequestOperationFilters] = useState(immediateFilters)

  useEffect(() => {
    const timer = setTimeout(() => setRequestOperationFilters(immediateFilters), 1000)
    return () => clearTimeout(timer)
  }, [immediateFilters])

  return { requestOperationFilters }
}
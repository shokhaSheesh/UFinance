import counterpartiesStore from '@/store/counterparties.store'
import { useEffect, useMemo, useState } from 'react'

export function useCounterpartiesFilters() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('list')

  const filters = counterpartiesStore.filters
  const setFilters = (updater) => {
    if (typeof updater === 'function') {
      counterpartiesStore.setFilters(updater(counterpartiesStore.filters))
    } else {
      counterpartiesStore.setFilters(updater)
    }
  }

  // Inner debounce: 500ms for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Build immediate filters
  const immediateFilterData = useMemo(() => ({
    limit: viewMode === 'list' ? 50 : 1000,
    debitPaymentTypes: filters.debitPaymentTypes,
    creditPaymentTypes: filters.creditPaymentTypes,
    operationDateStart: filters.operationDateStart,
    operationDateEnd: filters.operationDateEnd,
    calculationMethod: filters.calculationMethod,
    contrAgentId: filters.selectedCounterparties,
    operationCategoryId: filters.selectedChartOfAccounts,
    sellingDealId: filters.deals,
    legalEntitiesId: filters.selectedLegalEntities,
    searchString: viewMode === 'list' ? debouncedSearchQuery : '',
  }), [filters, debouncedSearchQuery, viewMode])

  // Outer debounce: 1000ms for API request
  const [requestFilterData, setRequestFilterData] = useState(immediateFilterData)

  useEffect(() => {
    const timer = setTimeout(() => {
      setRequestFilterData(immediateFilterData)
    }, 1000)
    return () => clearTimeout(timer)
  }, [immediateFilterData])

  return {
    requestFilterData,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    setDebouncedSearchQuery,
    viewMode,
    setViewMode,
    filters,
    setFilters,
  }
}

import { useMemo, useState, useEffect } from 'react'

export function useAccountsFilter(accountsStore) {
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(accountsStore.searchQuery)
  const [requestBankAccounts, setRequestBankAccounts] = useState(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(accountsStore.searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [accountsStore.searchQuery])

  // Build filters immediately (for debouncing)
  const immediateBankAccountsFilter = useMemo(() => {
    return {
      page: 1,
      limit: 100,
      search: debouncedSearchQuery.toLowerCase() || "",
      groupBy: accountsStore.selectedGrouping,
      nalichnye: accountsStore.isCash,
      beznalichnye: accountsStore.isNonCash,
      kartaFizlica: accountsStore.isCard,
      elektronnye: accountsStore.isElectronic,
      legal_entity_ids: accountsStore.selectedEntity,
      accounts_and_groups_ids: accountsStore.selectedAccounts,
    }
  }, [debouncedSearchQuery, accountsStore.selectedGrouping, accountsStore.isCash, accountsStore.isNonCash, accountsStore.isCard, accountsStore.isElectronic, accountsStore.selectedEntity, accountsStore.selectedAccounts])

  // Debounce all filter changes with 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      setRequestBankAccounts(immediateBankAccountsFilter)
    }, 1000)

    return () => clearTimeout(timer)
  }, [immediateBankAccountsFilter])

  return {
    requestBankAccounts,
    debouncedSearchQuery,
  }
}

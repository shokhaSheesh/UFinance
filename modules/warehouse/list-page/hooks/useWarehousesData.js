import { useDeleteWarehouse, useWarehousesList } from '@/hooks/useDashboard'
import { useEffect, useMemo, useState } from 'react'

export function useWarehousesData() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  const deleteMutation = useDeleteWarehouse()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: warehousesItems = [], isLoading } = useWarehousesList()

  // `list_warehouses` has no server-side search param, so filter client-side
  const warehouses = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase()
    const sorted = [...warehousesItems].sort((a, b) => {
      if (!!a.is_default !== !!b.is_default) return a.is_default ? -1 : 1
      return 0
    })
    if (!query) return sorted
    return sorted.filter((w) =>
      (w.name || '').toLowerCase().includes(query) ||
      (w.address || '').toLowerCase().includes(query)
    )
  }, [warehousesItems, debouncedSearchQuery])

  return {
    searchQuery,
    setSearchQuery,
    warehouses,
    warehousesItems,
    isLoading,
    deleteMutation,
  }
}

import { useDeleteLegalEntities, useLegalEntitiesPlanFact } from '@/hooks/useDashboard'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

export function useLegalEntitiesData(tc) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  const deleteMutation = useDeleteLegalEntities()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: legalEntitiesData, isLoading } = useLegalEntitiesPlanFact({
    page: 1,
    limit: 100,
    ...(debouncedSearchQuery && { search: debouncedSearchQuery.toLowerCase() }),
  })

  const legalEntitiesItems = useMemo(() => {
    const items = legalEntitiesData?.data?.data || []
    return Array.isArray(items) ? items : []
  }, [legalEntitiesData])

  const entities = useMemo(() => {
    return legalEntitiesItems.map((item) => ({
      id: item?.guid,
      guid: item?.guid,
      shortName: item?.nazvanie || tc('noName'),
      fullName: item?.polnoe_nazvanie || '-',
      inn: item?.inn?.toString() || '-',
      kpp: item?.kpp?.toString() || '-',
      rawData: item
    }))
  }, [legalEntitiesItems, tc])

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['legalEntitiesPlanFact'] })
    queryClient.invalidateQueries({ queryKey: ['legalEntitiesV2'] })
  }

  return {
    searchQuery,
    setSearchQuery,
    entities,
    legalEntitiesItems,
    isLoading,
    deleteMutation,
    invalidateQueries,
  }
}

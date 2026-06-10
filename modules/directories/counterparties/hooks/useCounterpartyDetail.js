import { useUcodeRequestMutation, useUcodeRequestQuery } from '@/hooks/useDashboard'
import operationsDto from '@/lib/dtos/operationsDto'
import { appStore } from '@/store/app.store'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { buildCounterpartyInfo, calculateOperationStats } from '../utils/counterpartiesUtils'

export function useCounterpartyDetail(counterpartyGuid, tc) {
  const router = useRouter()
  const ucodeRequestMutation = useUcodeRequestMutation()

  const [filters, setFilters] = useState({
    operationDateStart: "",
    operationDateEnd: "",
    calculationMethod: "Cashflow",
    dateRange: null,
    deals: []
  })
  const [isDeletingCounterparty, setIsDeletingCounterparty] = useState(false)

  const filterCounterParty = useMemo(() => ({
    guid: counterpartyGuid,
    operationDateStart: filters.operationDateStart,
    operationDateEnd: filters.operationDateEnd,
    calculationMethod: filters.calculationMethod,
    legal_entity_ids: [],
    chartOfAccountsIds: [],
    sellingDealId: filters.deals,
    page: 1
  }), [counterpartyGuid, filters])

  const directoryPermissions = appStore.permission.directories
  const canEdit = directoryPermissions.counterparties.edit
  const canDelete = directoryPermissions.counterparties.delete

  const { data: counterpartyData, isPending: isLoading } = useUcodeRequestQuery({
    method: 'get_counterparty_by_id',
    data: filterCounterParty,
    skip: !counterpartyGuid,
    querySetting: {
      refetchOnWindowFocus: false,
      staleTime: 0,
      cacheTime: 0
    }
  })

  const responseData = counterpartyData?.data?.data
  const counterparty = responseData?.counterparty || null
  const summary = responseData?.summary || null
  const counterpartyOperations = useMemo(() => responseData?.operations || [], [responseData])

  const operations = useMemo(() => operationsDto(counterpartyOperations, 'all'), [counterpartyOperations])

  const operationsList = useMemo(() => ({
    future: operationsDto(counterpartyOperations, 'future'),
    today: operationsDto(counterpartyOperations, 'today'),
    before: operationsDto(counterpartyOperations, 'before'),
  }), [counterpartyOperations])

  const counterpartyInfo = useMemo(() => buildCounterpartyInfo(counterparty, tc), [counterparty, tc])
  const stats = useMemo(() => calculateOperationStats(operations), [operations])

  const handleDeleteCounterparty = async () => {
    try {
      setIsDeletingCounterparty(true)
      await ucodeRequestMutation.mutateAsync({
        method: 'delete_counterparty',
        data: { guid: counterpartyGuid }
      })
      router.push('/directories/counterparties')
    } catch (error) {
      console.error('Error deleting counterparty:', error)
      setIsDeletingCounterparty(false)
    }
  }

  return {
    counterparty,
    counterpartyInfo,
    summary,
    operationsList,
    operations,
    stats,
    filters,
    setFilters,
    filterCounterParty,
    isLoading,
    canEdit,
    canDelete,
    handleDeleteCounterparty,
    isDeletingCounterparty,
  }
}

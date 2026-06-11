import { balanceStore } from '@/components/reports/balance/balance.store'
import { apiClient } from '@/lib/api/ucode/base'
import { showSuccessNotification } from '@/lib/utils/notifications'
import { handleDownload } from '@/utils/helpers'
import { useMutation, useQuery } from '@tanstack/react-query'
import moment from 'moment'
import { useEffect, useState } from 'react'

export function useBalanceData(t) {
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const { dateRange, selectedEntity, selectedCurrency, selectedCounterparties, selectedAccount } = balanceStore

  const filterData = {
    as_of: dateRange ? moment(dateRange.end).format('YYYY-MM-DD') : '',
    account_ids: selectedAccount ? selectedAccount : [],
    legal_entity_id: selectedEntity,
    user_currency_code: selectedCurrency,
    contr_agent_ids: selectedCounterparties,
  }

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["balance_report", filterData],
    queryFn: () => apiClient.invokeFunction({ method: "balance_report", data: filterData }),
    select: (res) => res?.data,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0,
    cacheTime: 0
  })

  const { mutate: exportBalanceReport, isPending: isExporting } = useMutation({
    mutationKey: ['export_balance_report'],
    mutationFn: () => apiClient.invokeFunction({ method: 'export_balance_report', data: filterData }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t('common.fileDownloaded'))
      const fileLink = uploadData?.data?.link
      if (fileLink) handleDownload(`https://cdn.u-code.io/${fileLink}`, 'balance_report.xlsx')
    }
  })

  useEffect(() => {
    if (!isInitialLoad || !data) return
    const hasData = (data?.assets && data.assets.length > 0) || (data?.liabilities && data.liabilities.length > 0) || (data?.equity && data.equity.length > 0)
    if (!hasData) return

    const firstLevelIds = new Set()
    const addFirstLevel = (items) => {
      items.forEach(item => {
        if (item?.children && item.children.length > 0) {
          firstLevelIds.add(item.id)
          item.children.forEach(child => {
            if (child?.children && child.children.length > 0) firstLevelIds.add(child.id)
          })
        }
      })
    }
    addFirstLevel(data?.data || [])
    setExpandedRows(firstLevelIds)
    setIsInitialLoad(false)
  }, [data, isInitialLoad])

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return {
    data,
    isLoading,
    isFetching,
    error,
    expandedRows,
    toggleRow,
    exportBalanceReport,
    isExporting,
  }
}

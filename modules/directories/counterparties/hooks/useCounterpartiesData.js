import { useUcodeRequestInfinite } from '@/hooks/useDashboard'
import { apiClient } from '@/lib/api/ucode/base'
import { showSuccessNotification } from '@/lib/utils/notifications'
import { handleDownload } from '@/utils/helpers'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { groupCounterparties, mapCounterpartyItem } from '../utils/counterpartiesUtils'

export function useCounterpartiesData(requestFilterData, viewMode) {
  const tc = useTranslations('Common')

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isPending,
    isLoading: isLoadingCounterparties
  } = useUcodeRequestInfinite({
    method: 'get_counterparties',
    data: requestFilterData,
    querySetting: {
      select: response => response,
      staleTime: 0,
      cacheTime: 0,
    },
  })

  const { data: summaryData } = useQuery({
    queryKey: ['get_counterpaties_total', requestFilterData],
    queryFn: () => apiClient.invokeFunction({ method: 'get_counterparties_summary', data: requestFilterData }),
    placeholderData: keepPreviousData,
    select: data => data?.data?.data
  })

  const summary = useMemo(() => ({
    count: summaryData?.counterparties_count || 0,
    income: summaryData?.income || 0,
    debitorka: summaryData?.debitorka,
    expense: summaryData?.expense,
    kreditorka: summaryData?.kreditorka,
    profit: summaryData?.profit,
    difference: summaryData?.difference
  }), [summaryData])

  const { mutate: exportCounterparties, isPending: isExporting } = useMutation({
    mutationKey: ['export_counterparties'],
    mutationFn: () => apiClient.invokeFunction({ method: 'export_counterparties', data: requestFilterData }),
    onSuccess: (uploadData) => {
      showSuccessNotification(tc('fileDownloaded'))
      const fileLink = uploadData?.data?.link
      if (fileLink) {
        handleDownload(`https://cdn.u-code.io/${fileLink}`, 'balance_report.xlsx')
      }
    }
  })

  const allCounterparties = useMemo(() => {
    return infiniteData?.pages?.flatMap(page => page?.data?.data || []) || []
  }, [infiniteData])

  const { groupedCounterparties, flatCounterparties } = useMemo(() => {
    const items = allCounterparties.map((item, index) => mapCounterpartyItem(item, index, tc))
    return {
      groupedCounterparties: groupCounterparties(items),
      flatCounterparties: items
    }
  }, [allCounterparties, tc])

  const counterpartiesGroups = useMemo(() => {
    return groupedCounterparties.map((group) => ({
      id: group.id,
      guid: group.guid,
      nazvanie: group.nazvanie,
      opisanie_gruppy: null,
      data_sozdaniya: null,
      isGroup: true,
      items: []
    }))
  }, [groupedCounterparties])

  return {
    allCounterparties,
    groupedCounterparties,
    flatCounterparties,
    counterpartiesGroups,
    summary,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingCounterparties,
    isFetching,
    isPending,
    exportCounterparties,
    isExporting,
  }
}

import { useScrollDetector } from '@/hooks/useScrollDetector'
import { apiClient } from '@/lib/api/ucode/base'
import { showSuccessNotification } from '@/lib/utils/notifications'
import { authStore } from '@/store/auth.store'
import { defaultRangeMonth, student } from '@/store/student.store'
import { formatStudentTableDate } from '@/utils/formatDate'
import { handleDownload } from '@/utils/helpers'
import { useInfiniteQuery, useMutation } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

const LIMIT = 50

export function useStudentsData(t) {
  const { isScrolling, handleScroll: onScrollActivity, scrollRef } = useScrollDetector(2000)
  const { accounting, rangeMonth, status } = student

  const filterData = {
    accounting_method: accounting,
    currency_code: "UZS",
    company_id: authStore.userData?.company_id,
    limit: LIMIT,
    counterparties_ids: student.selectedCounterParties,
    from_date: rangeMonth?.start,
    to_date: rangeMonth?.end,
    counterparties_group_id: student.selectedCounterPartiesGroups,
    contract_status: status === 'active' ? true : status === 'passive' ? false : null
  }

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isFetching,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ['students', filterData],
    queryFn: ({ pageParam = 1 }) => apiClient.invokeFunction({
      method: 'get_counterparties_data_by_query',
      data: { ...filterData, page: pageParam }
    }),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.data?.data?.counterparties?.pagination
      if (!pagination) return undefined
      const { page, totalPages } = pagination
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 0,
    cacheTime: 0
  })

  const { mutate: exportStudents, isPending: isStudentsExportLoading } = useMutation({
    mutationKey: ['export_students'],
    mutationFn: () => apiClient.invokeFunction({ method: 'export_students', data: filterData }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t('common.fileDownloaded'))
      const fileLink = uploadData?.data?.link
      if (fileLink) handleDownload(`https://cdn.u-code.io/${fileLink}`, 'balance_report.xlsx')
    }
  })

  const handleContainerScroll = useCallback(() => {
    onScrollActivity()
    const container = scrollRef.current
    if (!container || !hasNextPage || isFetchingNextPage) return
    const { scrollTop, scrollHeight, clientHeight } = container
    if (scrollHeight - scrollTop - clientHeight < 100) fetchNextPage()
  }, [onScrollActivity, scrollRef, hasNextPage, isFetchingNextPage, fetchNextPage])

  const studentList = useMemo(() => {
    return infiniteData?.pages?.flatMap(page => page?.data?.data?.counterparties?.items || []) || []
  }, [infiniteData])

  const totalMonths = useMemo(() => {
    return infiniteData?.pages?.flatMap(page => page?.data?.data?.total_by_months || []) || []
  }, [infiniteData])

  const fullTotalMonths = useMemo(() => {
    return infiniteData?.pages?.flatMap(page => page?.data?.data?.total || [])?.[0] || []
  }, [infiniteData])

  const monthsData = useMemo(() => {
    if (studentList.length === 0) return []
    const firstStudent = studentList[0]
    const months = firstStudent?.months || []
    return months.map((m, index) => ({
      key: m?.month,
      label: formatStudentTableDate(m?.month),
      total_plan: totalMonths?.[index]?.total_plan,
      total_fact: totalMonths?.[index]?.total_fact,
      total_plan_fact: totalMonths?.[index]?.total_plan_fact
    }))
  }, [studentList, totalMonths])

  const columns = useMemo(() => {
    const cols = [
      { key: 'fio', type: 'sticky', label: t('students.columns.fio'), width: 'w-[400px] line-clamp-1 max-w-[500px]' },
      { key: 'group', type: 'sticky', label: t('students.columns.group'), width: 'w-44 line-clamp-1 left-[400px]! line-clamp-1' },
      { key: 'status', type: 'sticky', label: t('students.columns.status'), width: 'w-24 line-clamp-1 left-[576px] max-w-32' }
    ]
    monthsData.forEach(month => {
      cols.push({
        key: month?.key,
        type: 'month-group',
        label: month?.label,
        width: 'min-w-96 max-w-[500px]',
        children: [
          { key: `${month?.key}-plan`, type: 'data', label: t('students.columns.plan') },
          { key: `${month?.key}-fact`, type: 'data', label: t('students.columns.fact') },
          { key: `${month?.key}-planFact`, type: 'data', label: t('students.columns.difference') }
        ],
        totalPrices: [
          { total: month?.total_plan },
          { total: month?.total_fact },
          { total: month?.total_plan_fact }
        ]
      })
    })
    cols.push(
      { key: 'totalPlan', type: 'total', label: t('students.columns.totalPlan'), width: 'min-w-44 max-w-44', total: fullTotalMonths?.total_fact },
      { key: 'totalFact', type: 'total', label: t('students.columns.totalFact'), width: 'min-w-44 max-w-44', total: fullTotalMonths?.total_plan },
      { key: 'totalPlanFact', type: 'total', label: t('students.columns.totalDifference'), width: 'min-w-44 max-w-44', total: fullTotalMonths?.total_plan_fact }
    )
    return cols
  }, [monthsData, t, fullTotalMonths])

  const clearCount = useMemo(() => {
    let count = 0
    if (student.selectedCounterParties?.length > 0) count++
    if (student.selectedCounterPartiesGroups?.length > 0) count++
    if (status !== null) count++
    const isDefaultMonth =
      rangeMonth?.start && rangeMonth?.end &&
      new Date(rangeMonth.start).toDateString() === new Date(defaultRangeMonth.start).toDateString() &&
      new Date(rangeMonth.end).toDateString() === new Date(defaultRangeMonth.end).toDateString()
    if (!isDefaultMonth) count++
    return count
  }, [status, rangeMonth])

  const handleClearFilters = useCallback(() => {
    student.resetFilters()
    student.setState('status', null)
    refetch()
  }, [refetch])

  return {
    isScrolling,
    scrollRef,
    studentList,
    columns,
    isLoading,
    isFetching,
    isPending,
    isFetchingNextPage,
    handleContainerScroll,
    exportStudents,
    isStudentsExportLoading,
    clearCount,
    handleClearFilters,
    refetch,
  }
}

'use client'
import FilterButton from '@/components/shared/Filters/FilterButton'
import IconButton from '@/components/shared/Buttons/IconButton'
import { FilterSection, FilterSidebar } from "@/components/directories/FilterSidebar/FilterSidebar"
import SelectCounterParties from "@/components/ReadyComponents/SelectCounterParties"
import SelectCounterPartyGroup from "@/components/ReadyComponents/SelectCounterPartyGroup"
import CustomRangeMonthPicker from "@/components/shared/CustomRangeMonthPicker"
import ScreenLoader from "@/components/shared/ScreenLoader"
import SingleSelect from "@/components/shared/Selects/SingleSelect"
import useMounted from "@/hooks/useMounted"
import { useScrollDetector } from "@/hooks/useScrollDetector"
import { apiClient } from "@/lib/api/ucode/base"
import { showSuccessNotification } from "@/lib/utils/notifications"
import { authStore } from "@/store/auth.store"
import { defaultRangeMonth, student } from "@/store/student.store"
import { formatStudentTableDate } from "@/utils/formatDate"
import { formatNumber, handleDownload } from "@/utils/helpers"
import { useInfiniteQuery, useMutation } from "@tanstack/react-query"
import { Download } from "lucide-react"
import { observer } from "mobx-react-lite"
import { useTranslations } from "next-intl"
import { useCallback, useMemo, useState } from "react"


const LIMIT = 50

const Students = observer(() => {
  const t = useTranslations('Reports')
  const accountingMethodOptions = useMemo(() => [
    { value: 'accrual', label: t('students.accounting.accrual') },
    { value: 'cash', label: t('students.accounting.cash') }
  ], [t])

  const [open, setOpen] = useState(false)
  const mounted = useMounted()
  const { isScrolling, handleScroll: onScrollActivity, scrollRef } = useScrollDetector(2000)

  const { accounting, rangeMonth, setState, status } = student

  const clearCount = (() => {
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
  })()



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
    isFetching: isFetchingStudents,
    isLoading: isLoadingStudents,
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

  const handleClearFilters = useCallback(() => {
    student.resetFilters()
    student.setState('status', null)
    refetch()
  }, [refetch])


  const { mutate: exportStudents, isPending: isStudentsExportLoading } = useMutation({
    mutationKey: ['export_students'],
    mutationFn: () => apiClient.invokeFunction({ method: 'export_students', data: filterData }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t('common.fileDownloaded'))
      const fileLink = uploadData?.data?.link
      if (fileLink) {
        const contractFileLink = `https://cdn.u-code.io/${fileLink}`
        handleDownload(contractFileLink, 'balance_report.xlsx')
      }
    }
  })

  const handleContainerScroll = useCallback(() => {
    onScrollActivity()

    const container = scrollRef.current
    if (!container || !hasNextPage || isFetchingNextPage) return

    const { scrollTop, scrollHeight, clientHeight } = container
    if (scrollHeight - scrollTop - clientHeight < 100) {
      fetchNextPage()
    }
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



  // Extract unique months from student data (use first student as reference)
  const monthsData = useMemo(() => {
    const dataSource = studentList.length > 0 ? studentList : []
    if (dataSource.length === 0) return []

    // Get unique months from first student's data
    const firstStudent = dataSource[0]
    const months = firstStudent.months || []


    return months.map((m, index) => ({
      key: m.month,
      label: formatStudentTableDate(m.month), // You can format this if needed, e.g., '04.2026' -> 'April 2026'
      total_plan: totalMonths?.[index]?.total_plan,
      total_fact: totalMonths?.[index]?.total_fact,
      total_plan_fact: totalMonths?.[index]?.total_plan_fact
    }))
  }, [studentList, totalMonths])


  // Build unified columns array - nested structure for months
  const columns = useMemo(() => {
    const cols = [
      { key: 'fio', type: 'sticky', label: t('students.columns.fio'), width: 'w-[400px] line-clamp-1 max-w-[500px]' },
      { key: 'group', type: 'sticky', label: t('students.columns.group'), width: 'w-44 line-clamp-1  left-[400px]! line-clamp-1' },
      { key: 'status', type: 'sticky', label: t('students.columns.status'), width: 'w-24 line-clamp-1 left-[576px] max-w-32' }
    ]

    monthsData.forEach(month => {
      cols.push({
        key: month.key,
        type: 'month-group',
        label: month.label,
        width: 'min-w-96 max-w-[500px]',
        children: [
          { key: `${month.key}-plan`, type: 'data', label: t('students.columns.plan') },
          { key: `${month.key}-fact`, type: 'data', label: t('students.columns.fact') },
          { key: `${month.key}-planFact`, type: 'data', label: t('students.columns.difference') }
        ],
        totalPrices: [
          { total: month.total_plan },
          { total: month.total_fact },
          { total: month.total_plan_fact }
        ]
      })
    })

    cols.push(
      { key: 'totalPlan', type: 'total', label: t('students.columns.totalPlan'), width: 'min-w-44 max-w-44', total: fullTotalMonths?.total_plan },
      { key: 'totalFact', type: 'total', label: t('students.columns.totalFact'), width: 'min-w-44 max-w-44', total: fullTotalMonths?.total_fact },
      { key: 'totalPlanFact', type: 'total', label: t('students.columns.totalDifference'), width: 'min-w-44 max-w-44', total: fullTotalMonths?.total_plan_fact }
    )

    return cols
  }, [monthsData, t, fullTotalMonths])

  return (
    <div className="w-[calc(100%_-_var(--sidebar-w))] flex h-[calc(100%-60px)] fixed left-[var(--sidebar-w)] top-[60px]">
      {(isLoadingStudents || isFetchingStudents || isPending) && !isScrolling && <ScreenLoader />}
      {isFetchingNextPage && !isScrolling && <ScreenLoader />}
      <FilterSidebar
        isOpen={open}
        clearCount={clearCount}
        onClear={handleClearFilters}
        onClose={() => setOpen(false)}
      >
        <FilterSection title={t('common.date')}>
          <CustomRangeMonthPicker
            value={rangeMonth}
            handleSubmit={() => {
              refetch()
            }}
            onChange={(months) => setState('rangeMonth', months)}
            range
          />
        </FilterSection>
        <FilterSection title={t('common.counterparty')}>
          <SelectCounterParties
            value={student.selectedCounterParties}
            onChange={(value) => student.setState('selectedCounterParties', value)}
          />
        </FilterSection>
        <FilterSection title={t('common.counterpartyGroup')}>
          <SelectCounterPartyGroup
            multi={true}
            value={student.selectedCounterPartiesGroups}
            onChange={(value) => student.setState('selectedCounterPartiesGroups', value)}
          />
        </FilterSection>
        <FilterSection title={t('students.statusTile')}>
          <SingleSelect
            data={[{
              value: 'active', label: t('students.status.active'),
            }, {
              value: 'passive', label: t('students.status.passive')
            }]}
            value={student.status}
            onChange={(value) => student.setState('status', value)}
          />
        </FilterSection>
      </FilterSidebar>
      <div className="flex-1 flex flex-col overflow-hidden relative bg-white px-4">
        {/* Header */}
        <div className="flex items-center top-0 sticky z-100  py-4 bg-white justify-between">
          <div className="flex gap-2 flex-1">
            <h1 className="text-xl font-semibold text-gray-900 text-nowrap">{t('students.title')}</h1>
            <FilterButton onClick={() => setOpen(true)} />

          </div>
          <div className="flex items-center gap-2">
            {mounted && (
              <SingleSelect
                data={accountingMethodOptions}
                value={student.accounting}
                onChange={(value) => {
                  student.setState('accounting', value)
                  refetch()
                }}
                isClearable={false}
                withSearch={false}
                className="bg-white w-44"
              />
            )}
            <IconButton icon={Download} label={t('common.downloadExcel')} onClick={exportStudents} loading={isStudentsExportLoading} />
          </div>
        </div>

        {/* Table Container - Div based layout */}
        <div ref={scrollRef} onScroll={handleContainerScroll} id="scrollableDiv" className="overflow-auto mb-5 relative ">
          <div className="bg-white min-w-max">
            <div className="sticky top-0 z-20 flex ">
              {columns.map((col) => {
                if (col.type === 'sticky') {
                  return (
                    <div
                      key={col.key}
                      className={`sticky left-0 z-30 bg-neutral-100 border-b border-r border-gray-200 px-4 py-3 text-left font-medium text-gray-700 ${col.width} flex items-center justify-center whitespace-nowrap text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] `}
                    >
                      {col.label}
                    </div>
                  )
                }

                if (col.type === 'month-group') {
                  return (
                    <div key={col.key} className={`flex flex-col border-b border-gray-200 flex-1 ${col.width} max-w-[500px] bg-neutral-100`}>
                      <div className="border-r text-sm border-gray-200 px-4 py-2 text-center font-medium text-gray-700 whitespace-nowrap">
                        {col.label}
                      </div>
                      <div className="flex text-sm">
                        {col.children.map((child) => (
                          <div key={child.key} className="border-t border-r border-gray-200 px-2 py-2 font-medium text-gray-600 flex-1 text-center whitespace-nowrap">
                            {child.label}
                          </div>
                        ))}
                      </div>
                      <div className="flex text-sm">
                        {col.totalPrices.map((child) => (
                          <div key={child.key} className="border-t border-r border-gray-200 px-2 py-2 font-medium text-gray-600 flex-1 text-center whitespace-nowrap">
                            {formatNumber(child.total)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }



                return (
                  <div key={col.key} className={`border-b ${col.key === 'totalPlan' ? 'border-r' : col.key === 'totalFact' ? 'border-r' : ''} ${col.width} bg-neutral-100 flex flex-col border-gray-200  font-medium text-gray-700  whitespace-nowrap text-sm`}>
                    <div className='border-b px-4 flex-1 py-3 flex text-center items-center justify-center'>
                      {col?.label}
                    </div>
                    <div className=' p-2  flex text-center items-center justify-center'>{formatNumber(col?.total)}</div>
                  </div>
                )
              })}
            </div>
            <StudentsBody
              studentList={studentList}
              columns={columns}
              isFetchingNextPage={isFetchingNextPage}
            />
          </div>
        </div>
      </div>
    </div>
  )
})

// Body rows component - no separate scroll container, sticky works with parent
const StudentsBody = ({ studentList, columns }) => {
  const t = useTranslations('Reports')
  return (
    <div>
      {studentList.map((studentItem, index) => (
        <div key={studentItem.counterparty_id} className="flex hover:bg-neutral-100 h-9">
          {columns.map((col) => {
            if (col.type === 'sticky') {
              const name = col.key === 'fio' ? studentItem.counterparty_name : col.key === 'group' ? studentItem.counterparties_group_nazvanie : (studentItem.contract_status ? t('students.status.active') : t('students.status.passive'));
              const prefix = col.key === 'fio' ? <span className="pr-2 w-8! text-center">{index + 1}</span> : null;
              const textCenter = col.key !== 'fio' ? 'text-center!' : '';
              return (
                <div
                  key={col.key}
                  className={`sticky left-0 z-10 line-clamp-1 bg-white border-b border-r border-gray-200  text-sm text-gray-900 ${col.width} flex items-center whitespace-nowrap line-clamp-1 overflow-hidden shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] `}
                >
                  <div className={`px-2 py-3 w-full  flex-1 flex gap-1 `}>
                    {prefix} <span className={`flex-1 ${textCenter} line-clamp-1`}>{name}</span>
                  </div>
                </div>
              )
            }

            if (col.type === 'month-group') {
              const monthData = studentItem.months?.find(m => m.month === col.key)
              return (
                <div key={col.key} className={`flex flex-1 ${col.width} text-sm`}>
                  {col.children.map((child) => {
                    const value = child.key.endsWith('-plan') ? monthData?.plan
                      : child.key.endsWith('-fact') ? monthData?.fact
                        : monthData?.plan_fact
                    return (
                      <div
                        key={child.key}
                        className="border-r border-b box-border border-gray-200 px-2 py-2 text-center text-gray-700 flex-1 flex items-center justify-center"
                      >
                        {formatNumber(value) || '-'}
                      </div>
                    )
                  })}
                </div>
              )
            }

            // Total columns
            const value = col.key === 'totalPlan' ? studentItem.total_plan : col.key === 'totalFact' ? studentItem.total_fact : studentItem.total_plan_fact
            return (
              <div
                key={col.key}
                className={`border-b ${col.key === 'totalPlan' || col.key === 'totalFact' ? 'border-r' : ''} ${col.width} border-gray-200 px-2 py-3 text-center font-medium text-gray-900 flex items-center justify-center text-sm line-clamp-1`}
              >
                {formatNumber(value)}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default Students
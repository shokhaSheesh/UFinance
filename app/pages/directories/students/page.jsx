'use client'
import { observer } from "mobx-react-lite"
import { useEffect, useMemo, useRef, useState } from "react"
import { FilterSection, FilterSidebar } from "../../../../components/directories/FilterSidebar/FilterSidebar"
import SelectCounterParties from "../../../../components/ReadyComponents/SelectCounterParties"
import CustomRangeMonthPicker from "../../../../components/shared/CustomRangeMonthPicker"
import ScreenLoader from "../../../../components/shared/ScreenLoader"
import SingleSelect from "../../../../components/shared/Selects/SingleSelect"
import { useUcodeRequestInfinite } from "../../../../hooks/useDashboard"
import useMounted from "../../../../hooks/useMounted"
import { authStore } from "../../../../store/auth.store"
import { student } from "../../../../store/student.store"
import { formatStudentTableDate } from "../../../../utils/formatDate"
import { formatNumber } from "../../../../utils/helpers"


const LIMIT = 200

const accountingMethodOptions = [
  { value: 'accrual', label: 'Метод начисления' },
  { value: 'cash', label: 'Кассовый метод' }
]

const Students = observer(() => {
  const [open, setOpen] = useState(true)
  const mounted = useMounted()
  const scrollContainerRef = useRef(null)

  const { accounting } = student

  const filterData = {
    method: accounting,
    currency_code: "UZS",
    company_id: authStore.userData?.company_id,
    limit: LIMIT
  }

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingStudents
  } = useUcodeRequestInfinite({
    method: 'get_counterparties_data',
    data: filterData
  })

  // Infinite scroll detection on main container
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !hasNextPage || isFetchingNextPage) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollHeight - scrollTop - clientHeight < 100) {
        fetchNextPage()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const studentList = useMemo(() => {
    return infiniteData?.pages?.flatMap(page => page?.data?.data?.counterparties || []) || []
  }, [infiniteData])


  // Extract unique months from student data (use first student as reference)
  const monthsData = useMemo(() => {
    const dataSource = studentList.length > 0 ? studentList : []
    if (dataSource.length === 0) return []

    // Get unique months from first student's data
    const firstStudent = dataSource[0]
    const months = firstStudent.months || []

    return months.map(m => ({
      key: m.month,
      label: formatStudentTableDate(m.month) // You can format this if needed, e.g., '04.2026' -> 'April 2026'
    }))
  }, [studentList])


  // Build unified columns array - nested structure for months
  const columns = useMemo(() => {
    const cols = [
      { key: 'fio', type: 'sticky', label: 'FIO', width: 'min-w-96 max-w-[500px]' }
    ]

    monthsData.forEach(month => {
      cols.push({
        key: month.key,
        type: 'month-group',
        label: month.label,
        width: 'min-w-96 max-w-[500px]',
        children: [
          { key: `${month.key}-plan`, type: 'data', label: 'Plan' },
          { key: `${month.key}-fact`, type: 'data', label: 'Fact' },
          { key: `${month.key}-planFact`, type: 'data', label: 'Plan-Fact' }
        ]
      })
    })

    // Add total columns
    cols.push(
      { key: 'totalPlan', type: 'total', label: 'Total Plan', width: 'min-w-44 max-w-44' },
      { key: 'totalFact', type: 'total', label: 'Total Fact', width: 'min-w-44 max-w-44' }
    )

    return cols
  }, [monthsData])

  return (
    <div className="w-[calc(100%-80px)] flex h-[calc(100%-60px)] fixed left-[80px] top-[60px]">
      {isLoadingStudents || isFetchingNextPage && <ScreenLoader />}
      <FilterSidebar
        isOpen={open}
        onClose={() => setOpen(prev => !prev)}
      >
        <FilterSection title="Дата">
          <div className="w-full">
            <CustomRangeMonthPicker
              value={{
                start: student.rangeMonth?.[0] ? new Date(student.rangeMonth[0].year, student.rangeMonth[0].month - 1, 1) : null,
                end: student.rangeMonth?.[1] ? new Date(student.rangeMonth[1].year, student.rangeMonth[1].month - 1, 1) : null
              }}
              onChange={({ start, end }) => {
                const rangeMonth = [
                  start ? { year: start.getFullYear(), month: start.getMonth() + 1 } : { year: new Date().getFullYear(), month: 1 },
                  end ? { year: end.getFullYear(), month: end.getMonth() + 1 } : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }
                ]
                student.setState('rangeMonth', rangeMonth)
              }}
              clearable={false}
            />
          </div>
        </FilterSection>
        <FilterSection title="Контрагент">
          <SelectCounterParties
            value={student.selectedCounterParties}
            onChange={(value) => student.setState('selectedCounterParties', value)}
          />
        </FilterSection>
      </FilterSidebar>
      <div className="flex-1 flex flex-col overflow-hidden relative bg-white px-4">
        {/* Header */}
        <div className="flex items-center top-0 sticky z-100  py-4 bg-white justify-between">
          <div className="flex gap-2 flex-1">
            <h1 className="text-xl font-semibold text-gray-900 text-nowrap">Отчет о движении денежных средств</h1>

          </div>
          <div className="flex items-center gap-2">
            {mounted && (
              <SingleSelect
                data={accountingMethodOptions}
                value={student.accounting}
                onChange={(value) => {
                  student.setState('accounting', value)
                }}
                isClearable={false}
                withSearch={false}
                className="bg-white w-44"
              />
            )}
          </div>
        </div>

        {/* Table Container - Div based layout */}
        <div ref={scrollContainerRef} className="overflow-auto mb-5 ">
          <div className="bg-white min-w-max">
            <div className="sticky top-0 z-20 flex ">
              {columns.map((col) => {
                if (col.type === 'sticky') {
                  return (
                    <div
                      key={col.key}
                      className={`sticky left-0 z-30 bg-neutral-100 border-b border-r border-gray-200 px-4 py-3 text-left font-medium text-gray-700 ${col.width} flex items-center whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}
                    >
                      {col.label}
                    </div>
                  )
                }

                if (col.type === 'month-group') {
                  return (
                    <div key={col.key} className={`flex flex-col border-b border-gray-200 flex-1 ${col.width} max-w-[500px] bg-neutral-100`}>
                      <div className="border-r text-base border-gray-200 px-4 py-2 text-center font-medium text-gray-700 whitespace-nowrap">
                        {col.label}
                      </div>
                      <div className="flex text-sm">
                        {col.children.map((child) => (
                          <div key={child.key} className="border-t border-r border-gray-200 px-2 py-2 font-medium text-gray-600 flex-1 text-center whitespace-nowrap">
                            {child.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={col.key} className={`border-b ${col.key === 'totalPlan' ? 'border-r' : ''} ${col.width} bg-neutral-100 border-gray-200 px-4 py-3 text-center font-medium text-gray-700 flex items-center justify-center whitespace-nowrap text-sm`}>
                    {col.label}
                  </div>
                )
              })}
            </div>

            {/* Body Rows */}
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
const StudentsBody = ({ studentList, columns, isFetchingNextPage }) => {
  return (
    <div>
      {studentList.map((studentItem) => (
        <div key={studentItem.counterparty_id} className="flex hover:bg-neutral-100">
          {columns.map((col) => {
            if (col.type === 'sticky') {
              return (
                <div
                  key={col.key}
                  className={`sticky left-0 z-10 line-clamp-1 bg-white border-b border-r border-gray-200 px-4 py-3 text-sm text-gray-900 ${col.width} flex items-center whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}
                >
                  {studentItem.counterparty_name}
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
                        className="border-r border-b box-border border-gray-200 px-2 py-3 text-center text-gray-700 flex-1 flex items-center justify-center"
                      >
                        {formatNumber(value) || '-'}
                      </div>
                    )
                  })}
                </div>
              )
            }

            // Total columns
            const value = col.key === 'totalPlan' ? studentItem.total_plan : studentItem.total_fact
            return (
              <div
                key={col.key}
                className={`border-b ${col.key === 'totalPlan' ? 'border-r' : ''} ${col.width} border-gray-200 px-2 py-3 text-center font-medium text-gray-900 flex items-center justify-center text-sm line-clamp-1`}
              >
                {formatNumber(value)}
              </div>
            )
          })}
        </div>
      ))}
      {isFetchingNextPage && (
        <div className="py-4 text-center text-gray-500">Загрузка...</div>
      )}
    </div>
  )
}

export default Students
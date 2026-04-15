'use client'
import { useEffect, useMemo, useRef, useState } from "react"
import { FilterSidebar } from "../../../../components/directories/FilterSidebar/FilterSidebar"
import NewDateRangeComponent from '../../../../components/directories/NewDateRangeComponent'
import SelectLegelEntitties from '../../../../components/ReadyComponents/SelectLegelEntitties'
import SingleSelect from "../../../../components/shared/Selects/SingleSelect"
import { useUcodeRequestInfinite } from "../../../../hooks/useDashboard"
import useMounted from "../../../../hooks/useMounted"
import { appStore } from "../../../../store/app.store"
import { authStore } from "../../../../store/auth.store"
import { student } from "../../../../store/student.store"
import { formatStudentTableDate } from "../../../../utils/formatDate"
import { formatNumber } from "../../../../utils/helpers"

const studentsData = [
  {
    counterparty_id: "08fed8d0-87d7-4c5b-9247-f5345f0fac5b",
    counterparty_name: "htbgrf",
    months: [
      { fact: 0, month: "04.2026", plan: 0, plan_fact: 0 },
      { fact: 0, month: "05.2026", plan: 0, plan_fact: 0 }
    ],
    total_fact: 0,
    total_plan: 0,
    total_plan_fact: 0
  },
  {
    counterparty_id: "2336c0a0-edeb-4901-89a7-45e028feae68",
    counterparty_name: "uhygfd",
    months: [
      { fact: 0, month: "04.2026", plan: 0, plan_fact: 0 },
      { fact: 0, month: "05.2026", plan: 0, plan_fact: 0 }
    ],
    total_fact: 0,
    total_plan: 0,
    total_plan_fact: 0
  },
  {
    counterparty_id: "7c003b1d-269d-4ce1-9a7f-c3479029788d",
    counterparty_name: "Asilbek",
    months: [
      { fact: 100, month: "04.2026", plan: 14279403606.1036, plan_fact: 14279403506.1036 },
      { fact: 100, month: "05.2026", plan: 14279403606.1036, plan_fact: 14279403506.1036 }
    ],
    total_fact: 100,
    total_plan: 14279403606.1036,
    total_plan_fact: 14279403506.1036
  },
  {
    counterparty_id: "ae556deb-891a-4307-8492-640f23fa6e63",
    counterparty_name: "6543654",
    months: [
      { fact: 0, month: "04.2026", plan: 0, plan_fact: 0 },
      { fact: 0, month: "05.2026", plan: 0, plan_fact: 0 }
    ],
    total_fact: 0,
    total_plan: 0,
    total_plan_fact: 0
  },
  {
    counterparty_id: "d136e4f2-ef68-4f7a-bfe8-77016fa0bd66",
    counterparty_name: "Jamshid",
    months: [
      { fact: 0, month: "04.2026", plan: 0, plan_fact: 0 },
      { fact: 0, month: "05.2026", plan: 0, plan_fact: 0 }
    ],
    total_fact: 0,
    total_plan: 0,
    total_plan_fact: 0
  },
  {
    counterparty_id: "a1b2c3d4-e5f6-4g7h-8i9j-k0l1m2n3o4p5",
    counterparty_name: "Sunnat Trading",
    months: [
      { fact: 2500000, month: "04.2026", plan: 3000000, plan_fact: 500000 },
      { fact: 2500000, month: "05.2026", plan: 3000000, plan_fact: 500000 }
    ],
    total_fact: 2500000,
    total_plan: 3000000,
    total_plan_fact: 500000
  },
  {
    counterparty_id: "b2c3d4e5-f6g7-4h8i-9j0k-l1m2n3o4p5q6",
    counterparty_name: "Ferghana Goods",
    months: [
      { fact: 1800000, month: "04.2026", plan: 2000000, plan_fact: 200000 },
      { fact: 1800000, month: "05.2026", plan: 2000000, plan_fact: 200000 }
    ],
    total_fact: 1800000,
    total_plan: 2000000,
    total_plan_fact: 200000
  },
  {
    counterparty_id: "c3d4e5f6-g7h8-4i9j-0k1l-m2n3o4p5q6r7",
    counterparty_name: "Tashkent Export",
    months: [
      { fact: 5500000, month: "04.2026", plan: 5000000, plan_fact: -500000 },
      { fact: 5500000, month: "05.2026", plan: 5000000, plan_fact: -500000 }
    ],
    total_fact: 5500000,
    total_plan: 5000000,
    total_plan_fact: -500000
  },
  {
    counterparty_id: "d4e5f6g7-h8i9-4j0k-1l2m-n3o4p5q6r7s8",
    counterparty_name: "Global Solutions",
    months: [
      { fact: 0, month: "04.2026", plan: 1500000, plan_fact: 1500000 },
      { fact: 0, month: "05.2026", plan: 1500000, plan_fact: 1500000 }
    ],
    total_fact: 0,
    total_plan: 1500000,
    total_plan_fact: 1500000
  },
  {
    counterparty_id: "e5f6g7h8-i9j0-4k1l-2m3n-o4p5q6r7s8t9",
    counterparty_name: "North Star LLC",
    months: [
      { fact: 3200000, month: "04.2026", plan: 3200000, plan_fact: 0 },
      { fact: 3200000, month: "05.2026", plan: 3200000, plan_fact: 0 }
    ],
    total_fact: 3200000,
    total_plan: 3200000,
    total_plan_fact: 0
  },
  {
    counterparty_id: "f6g7h8i9-j0k1-4l2m-3n4o-p5q6r7s8t9u0",
    counterparty_name: "Silk Road Trade",
    months: [
      { fact: 750000, month: "04.2026", plan: 900000, plan_fact: 150000 },
      { fact: 750000, month: "05.2026", plan: 900000, plan_fact: 150000 }
    ],
    total_fact: 750000,
    total_plan: 900000,
    total_plan_fact: 150000
  },
  {
    counterparty_id: "g7h8i9j0-k1l2-4m3n-4o5p-q6r7s8t9u0v1",
    counterparty_name: "Central Asia Group",
    months: [
      { fact: 4200000, month: "04.2026", plan: 4000000, plan_fact: -200000 },
      { fact: 4200000, month: "05.2026", plan: 4000000, plan_fact: -200000 }
    ],
    total_fact: 4200000,
    total_plan: 4000000,
    total_plan_fact: -200000
  },
  {
    counterparty_id: "h8i9j0k1-l2m3-4n4o-5p6q-r7s8t9u0v1w2",
    counterparty_name: "Prime Logistics",
    months: [
      { fact: 1200000, month: "04.2026", plan: 1500000, plan_fact: 300000 },
      { fact: 1200000, month: "05.2026", plan: 1500000, plan_fact: 300000 }
    ],
    total_fact: 1200000,
    total_plan: 1500000,
    total_plan_fact: 300000
  },
  {
    counterparty_id: "i9j0k1l2-m3n4-4o5p-6q7r-s8t9u0v1w2x3",
    counterparty_name: "Business Hub International",
    months: [
      { fact: 2800000, month: "04.2026", plan: 2600000, plan_fact: -200000 },
      { fact: 2800000, month: "05.2026", plan: 2600000, plan_fact: -200000 }
    ],
    total_fact: 2800000,
    total_plan: 2600000,
    total_plan_fact: -200000
  },
  {
    counterparty_id: "j0k1l2m3-n4o5-4p6q-7r8s-t9u0v1w2x3y4",
    counterparty_name: "Tech Innovations Ltd",
    months: [
      { fact: 0, month: "04.2026", plan: 0, plan_fact: 0 },
      { fact: 0, month: "05.2026", plan: 0, plan_fact: 0 }
    ],
    total_fact: 0,
    total_plan: 0,
    total_plan_fact: 0
  }
]

const LIMIT = 10

const Students = () => {
  const [open, setOpen] = useState(false)
  const mounted = useMounted()
  const scrollContainerRef = useRef(null)

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingStudents
  } = useUcodeRequestInfinite({
    method: 'get_counterparties_data',
    data: {
      method: "cash",
      currency_code: "UZS",
      company_id: authStore.userData?.company_id,
      limit: LIMIT
    }
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
      { key: 'fio', type: 'sticky', label: 'FIO', width: 'min-w-72 max-w-96' }
    ]

    // Add month columns (nested array structure) - dynamic from monthsData
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
      <FilterSidebar
        isOpen={open}
        onClose={() => setOpen(prev => !prev)}
      >
        <NewDateRangeComponent />
        <SelectLegelEntitties />
      </FilterSidebar>
      <div className="flex-1 flex flex-col overflow-hidden relative bg-white px-4">
        {/* Header */}
        <div className="flex items-center top-0 sticky z-100  py-4 bg-white justify-between">
          <div className="flex gap-2 flex-1">
            <h1 className="text-xl font-semibold text-gray-900 text-nowrap">Отчет о движении денежных средств</h1>
            {mounted && (
              <SingleSelect
                data={appStore.myCurrencies}
                value={student.currenyCode}
                onChange={(value) => {
                  student.setState('currenyCode', value)
                }}
                isClearable={false}
                withSearch={false}
                className={'bg-white w-28'}
                dropdownClassName={'w-28'}
              />
            )}
          </div>
          {/* <div className="flex items-center gap-2">
            <SingleSelect />
          </div> */}
        </div>

        {/* Table Container - Div based layout */}
        <div ref={scrollContainerRef} className="overflow-auto mb-5 max-h-[calc(100vh-180px)]">
          <div className="bg-white min-w-max">
            <div className="sticky top-0 z-20 flex bg-neutral-100">
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
                    <div key={col.key} className={`flex flex-col border-b border-gray-200 flex-1 ${col.width} max-w-[500px]`}>
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
}

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
                  className={`sticky left-0 z-10 bg-white border-b border-r border-gray-200 px-4 py-3 text-sm text-gray-900 ${col.width} flex items-center whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}
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
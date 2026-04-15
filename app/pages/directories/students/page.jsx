'use client'
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { FilterSidebar } from "../../../../components/directories/FilterSidebar/FilterSidebar"
import NewDateRangeComponent from '../../../../components/directories/NewDateRangeComponent'
import SelectLegelEntitties from '../../../../components/ReadyComponents/SelectLegelEntitties'
import SingleSelect from "../../../../components/shared/Selects/SingleSelect"
import { apiClient } from "../../../../lib/api/ucode/base"
import { appStore } from "../../../../store/app.store"
import { authStore } from "../../../../store/auth.store"
import { student } from "../../../../store/student.store"

// Sample months data - can be dynamic
const monthsData = [
  { key: 'sept', label: 'Sept 2026' },
  { key: 'oct', label: 'Oct 2026' },
  { key: 'nov', label: 'Nov 2026' },
  // Add more months to test overflow behavior
  // { key: 'dec', label: 'Dec 2026' },
  // { key: 'jan', label: 'Jan 2027' },
]

const studentsData = [
  { id: 1, name: "Firdavs Ibrokhimov", sept: { plan: 145, fact: 145, planFact: 145 }, oct: { plan: 145, fact: 145, planFact: 145 }, nov: { plan: 145, fact: 145, planFact: 145 }, totalPlan: 145, totalFact: 145 },
  { id: 2, name: "Firdavs Ibrokhimov", sept: { plan: 145, fact: 145, planFact: 145 }, oct: { plan: 145, fact: 145, planFact: 145 }, nov: { plan: 145, fact: 145, planFact: 145 }, totalPlan: 145, totalFact: 145 },
  { id: 3, name: "Firdavs Ibrokhimov", sept: { plan: 145, fact: 145, planFact: 145 }, oct: { plan: 145, fact: 145, planFact: 145 }, nov: { plan: 145, fact: 145, planFact: 145 }, totalPlan: 145, totalFact: 145 },
  { id: 4, name: "Firdavs Ibrokhimov", sept: { plan: 145, fact: 145, planFact: 145 }, oct: { plan: 145, fact: 145, planFact: 145 }, nov: { plan: 145, fact: 145, planFact: 145 }, totalPlan: 145, totalFact: 145 },
  { id: 5, name: "Firdavs Ibrokhimov", sept: { plan: 145, fact: 145, planFact: 145 }, oct: { plan: 145, fact: 145, planFact: 145 }, nov: { plan: 145, fact: 145, planFact: 145 }, totalPlan: 145, totalFact: 145 },
  { id: 6, name: "Firdavs Ibrokhimov", sept: { plan: 145, fact: 145, planFact: 145 }, oct: { plan: 145, fact: 145, planFact: 145 }, nov: { plan: 145, fact: 145, planFact: 145 }, totalPlan: 145, totalFact: 145 },
  { id: 7, name: "Firdavs Ibrokhimov", sept: { plan: 145, fact: 145, planFact: 145 }, oct: { plan: 145, fact: 145, planFact: 145 }, nov: { plan: 145, fact: 145, planFact: 145 }, totalPlan: 145, totalFact: 145 },
  { id: 8, name: "Firdavs Ibrokhimov", sept: { plan: 145, fact: 145, planFact: 145 }, oct: { plan: 145, fact: 145, planFact: 145 }, nov: { plan: 145, fact: 145, planFact: 145 }, totalPlan: 145, totalFact: 145 },
  { id: 9, name: "Firdavs Ibrokhimov", sept: { plan: 145, fact: 145, planFact: 145 }, oct: { plan: 145, fact: 145, planFact: 145 }, nov: { plan: 145, fact: 145, planFact: 145 }, totalPlan: 145, totalFact: 145 },
  { id: 10, name: "Firdavs Ibrokhimov", sept: { plan: 145, fact: 145, planFact: 145 }, oct: { plan: 145, fact: 145, planFact: 145 }, nov: { plan: 145, fact: 145, planFact: 145 }, totalPlan: 145, totalFact: 145 },
  { id: 11, name: "Firdavs Ibrokhimov", sept: { plan: 145, fact: 145, planFact: 145 }, oct: { plan: 145, fact: 145, planFact: 145 }, nov: { plan: 145, fact: 145, planFact: 145 }, totalPlan: 145, totalFact: 145 },
  { id: 12, name: "Firdavs Ibrokhimov", sept: { plan: 145, fact: 145, planFact: 145 }, oct: { plan: 145, fact: 145, planFact: 145 }, nov: { plan: 145, fact: 145, planFact: 145 }, totalPlan: 145, totalFact: 145 },
  { id: 13, name: "Firdavs Ibrokhimov", sept: { plan: 145, fact: 145, planFact: 145 }, oct: { plan: 145, fact: 145, planFact: 145 }, nov: { plan: 145, fact: 145, planFact: 145 }, totalPlan: 145, totalFact: 145 },
  { id: 14, name: "Firdavs Ibrokhimov", sept: { plan: 145, fact: 145, planFact: 145 }, oct: { plan: 145, fact: 145, planFact: 145 }, nov: { plan: 145, fact: 145, planFact: 145 }, totalPlan: 145, totalFact: 145 },
  { id: 15, name: "Firdavs Ibrokhimov", sept: { plan: 145, fact: 145, planFact: 145 }, oct: { plan: 145, fact: 145, planFact: 145 }, nov: { plan: 145, fact: 145, planFact: 145 }, totalPlan: 145, totalFact: 145 },
]

const Students = () => {
  const [open, setOpen] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: () => apiClient.invokeFunction({
      method: "get_counterparties_data",
      data: {
        "method": "cash",
        "currency_code": "UZS",
        "company_id": authStore.userData?.company_id   // Kompaniya ID
      }
    }),
    select: (data) => data?.data?.data || []
  })


  const studentList = useMemo(() => {
    return students?.counterparties || []
  }, [students])

  console.log('studentList', studentList)

  // Determine if we need overflow based on month count
  const needsOverflow = monthsData.length > 3

  const handleScroll = (direction) => {
    const container = document.getElementById('table-scroll-container')
    if (container) {
      const scrollAmount = 300
      const newPosition = direction === 'left'
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount
      container.scrollTo({ left: newPosition, behavior: 'smooth' })
      setScrollPosition(newPosition)
    }
  }

  const onScroll = (e) => {
    setScrollPosition(e.target.scrollLeft)
  }

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
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Отчет о движении денежных средств</h1>
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
          </div>
          {/* <div className="flex items-center gap-2">
            <SingleSelect />
          </div> */}
        </div>

        {/* Table Container - Div based layout */}
        <div className="overflow-y-auto mb-5">
          <div className="bg-white  ">
            <div className="sticky top-0 z-20 flex bg-neutral-100">
              {/* Sticky FIO Header */}
              <div className="sticky left-0 z-30 bg-neutral-100 border-b border-r border-gray-200 px-4 py-3 text-left font-medium text-gray-700 min-w-96 max-w-96 flex items-center whitespace-nowrap">
                FIO
              </div>

              {/* Month Headers */}
              <div className="flex ">
                {monthsData.map((month) => (
                  <div key={month.key} className="flex flex-col  border-b border-gray-200 flex-1 min-w-72 max-w-72  ">
                    <div className="border-r text-base border-gray-200 px-4 py-2 text-center font-medium text-gray-700 whitespace-nowrap">
                      {month.label}
                    </div>
                    <div className="flex text-sm">
                      <div className="border-t border-r border-gray-200 px-2 py-2 font-medium text-gray-600 flex-1 text-center whitespace-nowrap">Plan</div>
                      <div className="border-t border-r border-gray-200 px-2 py-2 font-medium text-gray-600 flex-1 text-center whitespace-nowrap">Fact</div>
                      <div className="border-t border-r border-gray-200 px-2 py-2 font-medium text-gray-600 flex-1 text-center whitespace-nowrap">Plan-Fact</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Headers */}
              <div className="flex text-sm min-w-44 max-w-44 bg-neutral-100">
                <div className="border-b border-r min-w-44 max-w-44 border-gray-200 px-4 py-3 text-center font-medium text-gray-700  flex items-center justify-center whitespace-nowrap">
                  Total Plan
                </div>
                <div className="border-b min-w-44 max-w-44 bg-neutral-100 border-gray-200 px-4 py-3 text-center font-medium text-gray-700  flex items-center justify-center whitespace-nowrap">
                  Total Fact
                </div>
              </div>
            </div>
            <div className="">
              {/* Body Rows */}
              {studentsData.map((studentItem) => (
                <div key={studentItem.id} className="flex hover:bg-neutral-100">
                  {/* Sticky FIO Cell */}
                  <div
                    className="sticky left-0 z-10 bg-white border-b border-r border-l border-gray-200 px-4 py-3 text-sm text-gray-900 min-w-96 max-w-96 flex items-center whitespace-nowrap"
                  >
                    {studentItem.name}
                  </div>

                  {/* Data Cells */}
                  <div className="flex text-sm">
                    {monthsData.map((month) => (
                      <div key={month.key} className="flex flex-1  min-w-72 max-w-72 ">
                        <div className="border-r border-b box-border border-gray-200 px-2 py-3 text-center text-gray-700 flex-1 flex items-center justify-center">{studentItem[month.key]?.plan || '-'}</div>
                        <div className="border-r border-b box-border border-gray-200 px-2 py-3 text-center text-gray-700 flex-1 flex items-center justify-center">{studentItem[month.key]?.fact || '-'}</div>
                        <div className="border-r border-b box-border border-gray-200 px-2 py-3 text-center text-gray-700 flex-1 flex items-center justify-center">{studentItem[month.key]?.planFact || '-'}</div>
                      </div>
                    ))}
                  </div>

                  {/* Total Cells */}
                  <div className="flex text-sm ">
                    <div className="border-b border-r min-w-44 max-w-44 border-gray-200 px-2 py-3 text-center font-medium text-gray-900  flex items-center justify-center">{studentItem.totalPlan}</div>
                    <div className="border-b border-r min-w-44 max-w-44 border-gray-200 px-2 py-3 text-center font-medium text-gray-900  flex items-center justify-center">{studentItem.totalFact}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Students
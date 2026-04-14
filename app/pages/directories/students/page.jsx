'use client'
import { useState } from "react"
import { FilterSidebar } from "../../../../components/directories/FilterSidebar/FilterSidebar"
import NewDateRangeComponent from '../../../../components/directories/NewDateRangeComponent'
import SelectLegelEntitties from '../../../../components/ReadyComponents/SelectLegelEntitties'
import SingleSelect from "../../../../components/shared/Selects/SingleSelect"
import { appStore } from "../../../../store/app.store"
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

  // Determine if we need overflow based on month count
  const needsOverflow = monthsData.length > 3
  const tableMinWidth = needsOverflow ? `${320 + monthsData.length * 180 + 200}px` : '100%'

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
      <div className="flex-1 overflow-auto relative bg-white">
        {/* Header */}
        <div className="flex items-center top-0 sticky z-100  p-4 bg-white justify-between">
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
        <div className="bg-white px-4 overflow-hidden">
          <div
            id="table-scroll-container"
            onScroll={onScroll}
            className={needsOverflow ? 'overflow-x-auto' : 'overflow-x-visible'}
            style={{ maxWidth: '100%' }}
          >
            <div style={{ minWidth: tableMinWidth }}>
              {/* Header Row - Sticky at top */}
              <div className="sticky top-0 z-20 flex bg-gray-50">
                {/* Sticky FIO Header */}
                <div
                  className="sticky left-0 z-30 bg-gray-50 border border-gray-200 px-4 py-3 text-left font-medium text-gray-700 min-w-[200px] flex items-center whitespace-nowrap"
                  style={{ boxShadow: '2px 0 4px rgba(0,0,0,0.1)' }}
                >
                  FIO
                </div>

                {/* Month Headers */}
                <div className="flex">
                  {monthsData.map((month) => (
                    <div key={month.key} className="flex flex-col border-t border-b border-gray-200 flex-1 min-w-96 max-w-96  ">
                      <div className="border-r border-gray-200 px-4 py-2 text-center font-medium text-gray-700 whitespace-nowrap">
                        {month.label}
                      </div>
                      <div className="flex">
                        <div className="border-t border-r border-gray-200 px-2 py-2 text-xs font-medium text-gray-600 flex-1 text-center whitespace-nowrap">Plan</div>
                        <div className="border-t border-r border-gray-200 px-2 py-2 text-xs font-medium text-gray-600 flex-1 text-center whitespace-nowrap">Fact</div>
                        <div className="border-t border-r border-gray-200 px-2 py-2 text-xs font-medium text-gray-600 flex-1 text-center whitespace-nowrap">Plan-Fact</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Headers */}
                <div className="flex ">
                  <div className="border min-w-96 max-w-96 border-gray-200 px-4 py-3 text-center font-medium text-gray-700 min-w-[100px] flex items-center justify-center whitespace-nowrap">
                    Total Plan
                  </div>
                  <div className="border min-w-96 max-w-96 border-gray-200 px-4 py-3 text-center font-medium text-gray-700 min-w-[100px] flex items-center justify-center whitespace-nowrap">
                    Total Fact
                  </div>
                </div>
              </div>

              {/* Body Rows */}
              {studentsData.map((studentItem) => (
                <div key={studentItem.id} className="flex hover:bg-gray-50">
                  {/* Sticky FIO Cell */}
                  <div
                    className="sticky left-0 z-10 bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 min-w-[200px] flex items-center whitespace-nowrap"
                    style={{ boxShadow: '2px 0 4px rgba(0,0,0,0.1)' }}
                  >
                    {studentItem.name}
                  </div>

                  {/* Data Cells */}
                  <div className="flex ">
                    {monthsData.map((month) => (
                      <div key={month.key} className="flex flex-1  min-w-96 max-w-96 ">
                        <div className="border-r border-b box-border border-gray-200 px-2 py-3 text-sm text-center text-gray-700 flex-1 flex items-center justify-center">{studentItem[month.key]?.plan || '-'}</div>
                        <div className="border-r border-b box-border border-gray-200 px-2 py-3 text-sm text-center text-gray-700 flex-1 flex items-center justify-center">{studentItem[month.key]?.fact || '-'}</div>
                        <div className="border-r border-b box-border border-gray-200 px-2 py-3 text-sm text-center text-gray-700 flex-1 flex items-center justify-center">{studentItem[month.key]?.planFact || '-'}</div>
                      </div>
                    ))}
                  </div>

                  {/* Total Cells */}
                  <div className="flex min-w-44 max-w-44">
                    <div className="border-b border-r border-gray-200 px-2 py-3 text-sm text-center font-medium text-gray-900 min-w-[100px] flex items-center justify-center">{studentItem.totalPlan}</div>
                    <div className="border-b border-r border-gray-200 px-2 py-3 text-sm text-center font-medium text-gray-900 min-w-[100px] flex items-center justify-center">{studentItem.totalFact}</div>
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
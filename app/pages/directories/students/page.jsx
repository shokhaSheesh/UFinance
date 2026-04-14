'use client'
import { useState } from "react"
import { FilterSidebar } from "../../../../components/directories/FilterSidebar/FilterSidebar"
import NewDateRangeComponent from '../../../../components/directories/NewDateRangeComponent'
import SelectLegelEntitties from '../../../../components/ReadyComponents/SelectLegelEntitties'
import SingleSelect from '../../../../components/shared/Selects/SingleSelect'

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
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Отчет о движении денежных средств</h1>
          <div className="flex items-center gap-2">
            <SingleSelect />

          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div
            id="table-scroll-container"
            onScroll={onScroll}
            className="overflow-x-auto"
            style={{ maxWidth: '100%' }}
          >
            <table className="w-full border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50">
                  {/* Sticky Name Column */}
                  <th
                    className="sticky left-0 z-20 bg-gray-50 border border-gray-200 px-4 py-3 text-left font-medium text-gray-700 min-w-[200px]"
                    style={{ boxShadow: '2px 0 4px rgba(0,0,0,0.1)' }}
                  >
                    FIO
                  </th>

                  {/* Sept 2026 */}
                  <th colSpan={3} className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                    <div>Sept 2026</div>
                  </th>

                  {/* Oct 2026 */}
                  <th colSpan={3} className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                    <div>Oct 2026</div>
                  </th>

                  {/* Nov 2026 */}
                  <th colSpan={3} className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                    <div>Nov 2026</div>
                  </th>

                  {/* Totals */}
                  <th rowSpan={2} className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-700 min-w-[100px]">
                    Total<br />Plan
                  </th>
                  <th rowSpan={2} className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-700 min-w-[100px]">
                    Total<br />Fact
                  </th>
                </tr>
                <tr className="bg-gray-50">
                  {/* Sub-headers for Sept */}
                  <th className="border border-gray-200 px-2 py-2 text-xs font-medium text-gray-600">Plan</th>
                  <th className="border border-gray-200 px-2 py-2 text-xs font-medium text-gray-600">Fact</th>
                  <th className="border border-gray-200 px-2 py-2 text-xs font-medium text-gray-600">Plan-Fact</th>

                  {/* Sub-headers for Oct */}
                  <th className="border border-gray-200 px-2 py-2 text-xs font-medium text-gray-600">Plan</th>
                  <th className="border border-gray-200 px-2 py-2 text-xs font-medium text-gray-600">Fact</th>
                  <th className="border border-gray-200 px-2 py-2 text-xs font-medium text-gray-600">Plan-Fact</th>

                  {/* Sub-headers for Nov */}
                  <th className="border border-gray-200 px-2 py-2 text-xs font-medium text-gray-600">Plan</th>
                  <th className="border border-gray-200 px-2 py-2 text-xs font-medium text-gray-600">Fact</th>
                  <th className="border border-gray-200 px-2 py-2 text-xs font-medium text-gray-600">Plan-Fact</th>
                </tr>
              </thead>
              <tbody>
                {studentsData.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    {/* Sticky Name Column */}
                    <td
                      className="sticky left-0 z-10 bg-white border border-gray-200 px-4 py-3 text-sm text-gray-900 min-w-[200px]"
                      style={{ boxShadow: '2px 0 4px rgba(0,0,0,0.1)' }}
                    >
                      {student.name}
                    </td>

                    {/* Sept Data */}
                    <td className="border border-gray-200 px-2 py-3 text-sm text-center text-gray-700">{student.sept.plan}</td>
                    <td className="border border-gray-200 px-2 py-3 text-sm text-center text-gray-700">{student.sept.fact}</td>
                    <td className="border border-gray-200 px-2 py-3 text-sm text-center text-gray-700">{student.sept.planFact}</td>

                    {/* Oct Data */}
                    <td className="border border-gray-200 px-2 py-3 text-sm text-center text-gray-700">{student.oct.plan}</td>
                    <td className="border border-gray-200 px-2 py-3 text-sm text-center text-gray-700">{student.oct.fact}</td>
                    <td className="border border-gray-200 px-2 py-3 text-sm text-center text-gray-700">{student.oct.planFact}</td>

                    {/* Nov Data */}
                    <td className="border border-gray-200 px-2 py-3 text-sm text-center text-gray-700">{student.nov.plan}</td>
                    <td className="border border-gray-200 px-2 py-3 text-sm text-center text-gray-700">{student.nov.fact}</td>
                    <td className="border border-gray-200 px-2 py-3 text-sm text-center text-gray-700">{student.nov.planFact}</td>

                    {/* Totals */}
                    <td className="border border-gray-200 px-2 py-3 text-sm text-center font-medium text-gray-900">{student.totalPlan}</td>
                    <td className="border border-gray-200 px-2 py-3 text-sm text-center font-medium text-gray-900">{student.totalFact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Students
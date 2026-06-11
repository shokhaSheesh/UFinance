import { formatNumber } from '@/utils/helpers'

const StudentsTableHeader = ({ columns }) => (
  <div className="sticky top-0 z-20 flex">
    {columns.map((col) => {
      if (col?.type === 'sticky') {
        return (
          <div
            key={col.key}
            className={`sticky left-0 z-30 bg-neutral-100 border-b border-r border-gray-200 px-4 py-3 text-left font-medium text-gray-700 ${col.width} flex items-center justify-center whitespace-nowrap text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}
          >
            {col.label}
          </div>
        )
      }
      if (col?.type === 'month-group') {
        return (
          <div key={col.key} className={`flex flex-col border-b border-gray-200 flex-1 ${col.width} max-w-[500px] bg-neutral-100`}>
            <div className="border-r text-sm border-gray-200 px-4 py-2 text-center font-medium text-gray-700 whitespace-nowrap">
              {col.label}
            </div>
            <div className="flex text-sm">
              {col.children?.map((child) => (
                <div key={child.key} className="border-t border-r border-gray-200 px-2 py-2 font-medium text-gray-600 flex-1 text-center whitespace-nowrap">
                  {child.label}
                </div>
              ))}
            </div>
            <div className="flex text-sm">
              {col.totalPrices?.map((child, i) => (
                <div key={i} className="border-t border-r border-gray-200 px-2 py-2 font-medium text-gray-600 flex-1 text-center whitespace-nowrap">
                  {formatNumber(child?.total)}
                </div>
              ))}
            </div>
          </div>
        )
      }
      return (
        <div key={col.key} className={`border-b ${col.key === 'totalPlan' ? 'border-r' : col.key === 'totalFact' ? 'border-r' : ''} ${col.width} bg-neutral-100 border-gray-200 px-4 py-3 text-center font-medium text-gray-700 flex items-center justify-center whitespace-nowrap text-sm`}>
          {col.label}
        </div>
      )
    })}
  </div>
)

export default StudentsTableHeader

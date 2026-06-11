import { ExpendClose, ExpendOpen } from '@/constants/icons'
import { cn } from '@/lib/utils'
import { formatNumber, formatTotalSumma } from '@/utils/helpers'

const CashFlowTableRow = ({ row, months, legend, depth = 0, expandedMap, onToggle, onCellClick }) => {
  const hasChildren = row?.subRows && row.subRows.length > 0
  const isExpanded = !!expandedMap[row?.uniquePath]
  const isTotal = row?.id === 'overall-cash-flow' || row?.id === 'ending-balance'
  const isBold = depth === 0 || isTotal

  const totalMonthSum = months.reduce((acc, m) => acc + (row?.months?.[m] || 0), 0)

  return (
    <>
      <tr className={`border-b box-content border-neutral-200 transition-colors ${depth === 0 ? 'bg-neutral-50 font-semibold' : 'hover:bg-neutral-50'}`}>
        <td className={cn(
          "sticky left-0 z-10 p-0! box-border transition-shadow duration-300",
          depth === 0 ? "bg-neutral-50" : "bg-white",
          "hover:bg-neutral-100 transition-colors",
        )}>
          <div
            className={`flex items-center w-full border-r py-2 text-xss! gap-2 ${hasChildren ? "cursor-pointer!" : "cursor-default"}`}
            style={{ paddingLeft: `${depth * 1 + 1}rem` }}
            onClick={hasChildren ? () => onToggle(row?.uniquePath) : undefined}
          >
            {hasChildren && (
              <button className="bg-transparent border-none p-0 flex items-center justify-center cursor-pointer text-neutral-500 hover:text-neutral-900 transition-colors w-4 h-4">
                {isExpanded ? <ExpendClose /> : <ExpendOpen />}
              </button>
            )}
            <span className={isBold ? "font-semibold" : "text-sm"}>{row?.name}</span>
          </div>
        </td>

        {months.map(month => {
          const val = row?.months?.[month] ?? 0
          const legendItem = legend.find(l => l?.key === month)
          return (
            <td key={month} className="px-2 cursor-pointer! text-xs text-end border-r min-w-[150px] max-w-[150px]">
              <span
                className={`${isBold ? "font-semibold" : ""} ${row?.isClickable ? ' hover:text-primary transition-colors' : ''}`}
                onClick={() => {
                  if (!row?.isClickable) return
                  onCellClick(row, { key: month, label: legendItem?.title || month })
                }}
              >
                <span className='line-clamp-1 text-end w-full cursor-pointer'>{formatNumber(formatTotalSumma(val))}</span>
              </span>
            </td>
          )
        })}

        <td className="px-2 text-right border-l min-w-[150px] max-w-[150px] cursor-pointer!">
          <span
            className={`text-xs line-clamp-1 ${isBold ? "font-semibold" : "text-xs"} ${!row?.isClickable ? ' hover:underline hover:text-primary transition-colors' : ''}`}
            onClick={() => {
              if (!row?.isClickable) return
              onCellClick(row, null)
            }}
          >
            {formatNumber(formatTotalSumma(row?.total || totalMonthSum))}
          </span>
        </td>
      </tr>

      {hasChildren && isExpanded && row.subRows.map(child => (
        <CashFlowTableRow
          key={child?.uniquePath}
          row={child}
          months={months}
          legend={legend}
          depth={depth + 1}
          expandedMap={expandedMap}
          onToggle={onToggle}
          onCellClick={onCellClick}
        />
      ))}
    </>
  )
}

export default CashFlowTableRow

import { ExpendClose, ExpendOpen } from '@/constants/icons'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/helpers'
import React from 'react'

const PnLTableRow = ({ item, parentExpanded = true, depth = 0, legend, expandedRows, onToggle, onCellClick }) => {
  if (!parentExpanded) return null

  const hasChildren = item?.details && item.details.length > 0
  const isExpanded = expandedRows.has(item?.id)
  const isPercentRow = item?.type === 'percent'
  const isResultRow = item?.type === 'result'
  const isTotalRow = item?.type === 'total'
  const paddingLeft = `${depth * 1 + 1}rem`

  return (
    <React.Fragment>
      <tr className={`border-b box-content border-neutral-200 transition-colors ${depth === 0 || isResultRow || isTotalRow ? 'bg-neutral-50 font-semibold' : 'hover:bg-neutral-50'}`}>
        <td className={`sticky left-0 z-10 p-0! box-border transition-shadow duration-300 ${depth === 0 || isResultRow || isTotalRow ? 'bg-neutral-50' : 'bg-white'} hover:bg-neutral-100 transition-colors`}>
          <div
            className={`flex items-center cursor-pointer! w-full border-r px-4 py-2 text-xss! gap-2 ${hasChildren ? '' : 'cursor-default'}`}
            style={{ paddingLeft }}
            onClick={() => hasChildren && onToggle(item?.id)}
          >
            {hasChildren && (
              <button className="bg-transparent border-none p-0 flex items-center justify-center cursor-pointer text-neutral-500 hover:text-neutral-900 transition-colors w-4 h-4">
                {isExpanded ? <ExpendClose /> : <ExpendOpen />}
              </button>
            )}
            <span className={cn('cursor-pointer!', depth === 0 || isResultRow || isTotalRow ? 'font-semibold' : 'text-sm')}>
              {item?.name}
            </span>
          </div>
        </td>

        {legend.map(period => {
          const value = item?.values?.[period?.key] || 0
          const displayValue = value === 0 ? '' : isPercentRow ? `${formatNumber(value)}%` : `${formatNumber(value)}`
          return (
            <td key={period?.key} className={`px-2 text-xs text-end border-r min-w-[150px] max-w-[150px] ${isPercentRow ? 'cursor-default' : 'cursor-pointer'}`}>
              <span
                className={`${isPercentRow ? 'cursor-default!' : 'cursor-pointer! hover:text-primary'} ${depth === 0 || isResultRow || isTotalRow ? 'font-semibold' : ''} transition-colors`}
                onClick={isPercentRow ? undefined : () => onCellClick(item, { key: period?.key, label: period?.title })}
              >
                <span className="line-clamp-1 text-end w-full">{displayValue}</span>
              </span>
            </td>
          )
        })}

        <td className={`px-2 text-right border-l min-w-[150px] max-w-[150px] ${isPercentRow ? 'cursor-default' : 'cursor-pointer'}`}>
          <span
            className={`text-xs line-clamp-1 ${isPercentRow ? 'cursor-default!' : 'cursor-pointer! hover:underline hover:text-primary'} ${depth === 0 || isResultRow || isTotalRow ? 'font-semibold' : 'text-xs'} transition-colors`}
            onClick={isPercentRow ? undefined : () => onCellClick(item, null)}
          >
            {item?.totalValue === 0 ? '' : isPercentRow ? `${formatNumber(item?.totalValue)}%` : formatNumber(item?.totalValue)}
          </span>
        </td>
      </tr>

      {hasChildren && isExpanded && item.details.map(child => (
        <PnLTableRow
          key={child?.id}
          item={child}
          parentExpanded={true}
          depth={depth + 1}
          legend={legend}
          expandedRows={expandedRows}
          onToggle={onToggle}
          onCellClick={onCellClick}
        />
      ))}
    </React.Fragment>
  )
}

export default PnLTableRow

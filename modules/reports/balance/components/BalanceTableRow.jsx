import { ExpendClose, ExpendOpen } from '@/constants/icons'
import { formatNumber, formatTotalSumma } from '@/utils/helpers'
import React from 'react'

const BalanceTableRow = ({ item, level = 0, parentExpanded = true, expandedRows, onToggle }) => {
  if (!parentExpanded) return null

  const children = item?.children || item?.details
  const hasChildren = children && children.length > 0
  const isExpanded = item?.name === 'active' || item?.name === 'passive' || expandedRows.has(item?.id)
  const indent = level * 24
  const isTotalRow = level === 0
  const isActiveOrPassive = item?.id === 'active' || item?.id === 'passive'

  return (
    <React.Fragment>
      <tr className={`border-b border-gray-100 transition-colors duration-200 hover:bg-[#f0f4f8] ${isTotalRow ? 'font-semibold' : ''}`}>
        <td
          className={`sticky left-0 z-1 min-w-[250px] px-2 py-1.5 text-xs text-slate-900 border-b border-r border-gray-200 whitespace-normal wrap-break-word ${isActiveOrPassive && 'bg-primary! text-white!'}`}
          style={{ paddingLeft: `${indent + 16}px`, backgroundColor: isActiveOrPassive ? '#007bff' : '#fff' }}
        >
          <div
            className={`flex items-center gap-2 ${hasChildren ? 'cursor-pointer select-none hover:opacity-80' : ''}`}
            onClick={() => hasChildren && onToggle(item?.id)}
          >
            {hasChildren && (
              <button className="bg-transparent border-0 cursor-pointer p-0 flex items-center justify-center text-gray-ucode-500 rounded transition-colors duration-200 hover:bg-gray-100 [&_svg]:w-5 [&_svg]:h-5">
                {isExpanded ? <ExpendClose color={isActiveOrPassive ? '#fff' : '#667085'} /> : <ExpendOpen color={isActiveOrPassive ? '#fff' : '#667085'} />}
              </button>
            )}
            <span className={isTotalRow ? 'font-semibold' : ''}>{item?.name}</span>
          </div>
        </td>
        <td className={`px-2 py-1.5 text-xs text-slate-900 border-b border-gray-200 text-right font-semibold whitespace-nowrap ${isActiveOrPassive && 'bg-primary! text-white!'}`}>
          <span className={isTotalRow ? 'text-xs font-semibold' : ''}>
            {(item?.value === 0 || item?.value == null) ? '–' : formatNumber(formatTotalSumma(item.value))}
          </span>
        </td>
      </tr>
      {hasChildren && isExpanded && children.map(child => (
        <BalanceTableRow
          key={child?.id}
          item={child}
          level={level + 1}
          parentExpanded={true}
          expandedRows={expandedRows}
          onToggle={onToggle}
        />
      ))}
    </React.Fragment>
  )
}

export default BalanceTableRow

import { GroupMenu } from '@/components/directories/GroupMenu/GroupMenu'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { ExpendClose, ExpendOpen } from '@/constants/icons'
import { cn } from '@/lib/utils'
import React from 'react'
import { safeCompare, safeFormatNumber } from '../utils/counterpartiesUtils'
import CounterpartyRow from './CounterpartyRow'

const GroupRow = ({
  group, isExpanded, isSelected, filters,
  onToggleGroup, onToggleSelect, isRowSelected,
  onNavigate, onGroupEdit, onGroupDelete, onGroupCreateCounterparty,
  onCounterpartyEdit, onCounterpartyDelete
}) => {
  const diffStyle = safeCompare(group?.difference)
  const profitStyle = safeCompare(group?.profit)
  const styleDifference = diffStyle === 'positive' ? 'text-emerald-500 font-medium' : diffStyle === 'negative' ? 'text-red-500 font-medium' : 'text-neutral-900 font-medium'
  const styleProfit = profitStyle === 'positive' ? 'text-emerald-500 font-medium' : profitStyle === 'negative' ? 'text-red-500 font-medium' : 'text-neutral-900 font-medium'

  return (
    <React.Fragment>
      <div
        className="flex min-h-[48px] items-center gap-1 hover:bg-neutral-50 border-b border-neutral-100 cursor-pointer bg-white text-sm"
        onClick={() => onToggleGroup(group.guid)}
      >
        <div className="w-12 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <OperationCheckbox checked={isSelected} onChange={() => onToggleSelect(group.id)} />
        </div>
        <div className="flex-1 min-w-[200px] flex px-3 items-center gap-2 font-medium">
          <button
            className="text-neutral-400 hover:text-neutral-600 outline-none flex items-center justify-center p-1"
            onClick={(e) => { e.stopPropagation(); onToggleGroup(group.guid) }}
          >
            {isExpanded ? <ExpendClose /> : <ExpendOpen />}
          </button>
          <span className="text-slate-900 truncate">{group.nazvanie} ({group.items?.length || 0})</span>
        </div>
        {filters.calculationMethod !== 'Cashflow' && (
          <div className="w-32 flex px-2 items-center text-neutral-500">–</div>
        )}
        <div className="w-24 flex px-2 items-center justify-center text-neutral-900 font-medium">
          {group?.operationsCount ?? 0}
        </div>
        <div className="w-32 flex px-2 items-center justify-end text-neutral-900 font-medium">
          {safeFormatNumber(group?.debitorka)}
        </div>
        <div className="w-32 flex px-2 items-center justify-end text-neutral-900 font-medium">
          {safeFormatNumber(group?.kreditorka)}
        </div>
        <div className="w-32 flex px-2 items-center justify-end text-neutral-900 font-medium">
          {safeFormatNumber(filters.calculationMethod === 'Cashflow' ? group?.income : group?.income)}
        </div>
        <div className="w-32 flex px-2 items-center justify-end text-neutral-900 font-medium">
          {safeFormatNumber(filters.calculationMethod === 'Cashflow' ? group?.expenses : group?.expenses)}
        </div>
        <div className={cn("w-32 flex px-2 items-center justify-end", filters.calculationMethod === 'Cashflow' ? styleDifference : styleProfit)}>
          {safeFormatNumber(filters.calculationMethod === 'Cashflow' ? group?.difference : group?.profit)}
        </div>
        <div className="w-10 flex px-2 items-center justify-center group" onClick={(e) => e.stopPropagation()}>
          <GroupMenu
            group={group}
            onEdit={onGroupEdit}
            onDelete={onGroupDelete}
            onCreateCounterparty={onGroupCreateCounterparty}
          />
        </div>
      </div>

      {isExpanded && group.items?.length === 0 && (
        <div className="bg-neutral-50/50 p-4 text-center text-neutral-400 text-xs font-medium border-b border-neutral-100">
          Нет контрагентов
        </div>
      )}

      {isExpanded && group.items?.map((counterparty) => (
        <CounterpartyRow
          key={counterparty.id}
          item={counterparty}
          isNested
          isSelected={isRowSelected(counterparty.id)}
          onToggleSelect={() => onToggleSelect(counterparty.id)}
          onNavigate={onNavigate}
          filters={filters}
          onEdit={onCounterpartyEdit}
          onDelete={onCounterpartyDelete}
        />
      ))}
    </React.Fragment>
  )
}

export default GroupRow

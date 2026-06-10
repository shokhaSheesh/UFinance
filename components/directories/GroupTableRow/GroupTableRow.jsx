import { AccountMenu } from '@/components/directories/AccountMenu/AccountMenu'
import { AccountTableRow } from '@/components/directories/AccountTableRow/AccountTableRow'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { ExpendClose, ExpendOpen } from '@/constants/icons'
import { formatAmount } from '@/utils/helpers'
import React from 'react'

export function GroupTableRow({ 
  group, 
  isExpanded, 
  onToggle, 
  onEdit, 
  onDelete,
  onAccountEdit,
  onAccountDelete 
}) {
  return (
    <React.Fragment>
      <tr
        className="hover:bg-neutral-50 bg-neutral-50/50 font-medium text-xs! cursor-pointer border-b border-gray-200 h-12"
        onClick={() => onToggle(group.guid)}
      >
        <td className="p-2 text-center">
          <div className="flex items-center justify-center">
            <OperationCheckbox onChange={() => { }} />
          </div>
        </td>
        <td className="p-2">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(group.guid); }}
              className="p-1 hover:bg-neutral-100 rounded transition-colors"
            >
              {isExpanded ? <ExpendClose /> : <ExpendOpen />}
            </button>
            <span className="text-slate-900">{group.name}</span>
            {group.items_count !== undefined ? (
              <span className="ml-1 text-neutral-400">({group.items_count})</span>
            ) : group.items?.length > 0 && (
              <span className="ml-1 text-neutral-400">({group.items.length})</span>
            )}
          </div>
        </td>
        <td className="p-2 text-nowrap">
          {group.nachalьnyy_ostatok_val !== undefined ? `${formatAmount(group.nachalьnyy_ostatok_val)} ${GlobalCurrency?.name}` : ''}
        </td>
        <td className="p-2 text-nowrap">
          {group.current_balance_val !== undefined ? `${formatAmount(group.current_balance_val)} ${GlobalCurrency?.name}` : ''}
        </td>
        <td className="p-2"></td>
        <td className="p-2"></td>
        <td className="p-2"></td>
        <td className="p-2"></td>
        <td className="p-2 text-end" onClick={(e) => e.stopPropagation()}>
          <AccountMenu
            onEdit={onEdit}
            onDelete={onDelete}
            isGroup={true}
          />
        </td>
      </tr>
      {isExpanded && (group.children || []).map((account) => (
        <AccountTableRow
          key={account.guid}
          account={account}
          onEdit={() => onAccountEdit(account)}
          onDelete={() => onAccountDelete(account)}
        />
      ))}
    </React.Fragment>
  )
}

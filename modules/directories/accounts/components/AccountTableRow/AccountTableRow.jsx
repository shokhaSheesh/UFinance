import React from 'react'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { AccountMenu } from '@/components/directories/AccountMenu/AccountMenu'
import { formatAccountFieldValue, ACCOUNT_FIELDS } from '../../utils/accountsFieldFormatter'

export function AccountTableRow({ account, onEdit, onDelete, onArchive }) {
  return (
    <tr className="hover:bg-neutral-50 border-b border-gray-100 transition-colors h-14">
      <td className="p-2">
        <div className="flex items-center justify-center">
          <OperationCheckbox onChange={() => { }} />
        </div>
      </td>
      <td className="p-2 text-sm text-[#0f172a] font-medium">
        {account.nazvanie}
      </td>
      {ACCOUNT_FIELDS.slice(1).map((field) => (
        <td key={field} className="p-2 text-sm text-[#0f172a]">
          {formatAccountFieldValue(account, field)}
        </td>
      ))}
      <td className="p-2 text-end">
        <AccountMenu
          account={account}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
        />
      </td>
    </tr>
  )
}

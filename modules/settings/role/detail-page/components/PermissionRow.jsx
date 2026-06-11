'use client'

import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { cn } from '../utils/permissionUtils'

const ACTIONS = ['read', 'add', 'edit', 'delete']

const PermissionRow = ({
  item,
  isChild = false,
  parent = null,
  permissions,
  onCheckboxChange,
  onParentCheckboxChange,
}) => {
  const id = item?.id

  const isActionAllowed = (action) => {
    if (isChild) return true
    return item?.allowedActions?.includes(action)
  }

  const isActionDisabled = (action) => {
    if (!isChild) return false
    if (!parent) return false
    return !permissions?.[parent?.id]?.[action]
  }

  const getCheckedValue = (action) => {
    if (isChild && parent) {
      return !!permissions?.[parent?.id]?.[id]?.[action]
    }
    return !!permissions?.[id]?.[action]
  }

  return (
    <tr className={cn('bg-white', isChild ? '' : 'font-medium')}>
      <td
        className={cn(
          'px-4 py-3 text-sm text-[#344054] border-b border-[#f2f4f7]',
          isChild ? 'pl-10' : '',
        )}
      >
        {!isChild ? item?.label : ''}
      </td>
      <td className="px-4 py-3 text-sm text-[#344054] border-b border-[#f2f4f7]">
        {isChild ? item?.label : ''}
      </td>
      {ACTIONS.map((action) => (
        <td
          key={action}
          className="px-4 py-3 text-sm text-[#344054] border-b border-[#f2f4f7] text-center w-[100px]"
        >
          {isActionAllowed(action) && (
            <div className="flex justify-center items-center">
              <OperationCheckbox
                disabled={isActionDisabled(action)}
                checked={getCheckedValue(action)}
                onChange={() => {
                  if (isActionDisabled(action)) return

                  if (item?.children) {
                    onParentCheckboxChange(item, action)
                  } else if (isChild && parent) {
                    onCheckboxChange(id, action, parent?.id)
                  } else {
                    onCheckboxChange(id, action)
                  }
                }}
              />
            </div>
          )}
        </td>
      ))}
    </tr>
  )
}

export default PermissionRow

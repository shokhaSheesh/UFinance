import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { ExpendClose, ExpendOpen } from '@/constants/icons'
import { useMemo } from 'react'
import { ACCOUNT_TABLE_HEADERS } from '../../utils/accountsFieldFormatter'
import { AccountTableRow } from '../AccountTableRow/AccountTableRow'
import { GroupTableRow } from '../GroupTableRow/GroupTableRow'
import styles from './accounts-table.module.scss'

export function AccountsTable({
  dataArray,
  selectedGrouping,
  expandedGroups,
  onToggleGroup,
  onAccountEdit,
  onAccountDelete,
  onGroupEdit,
  onGroupDelete,
  onExpandAll,
  isAllExpanded,
  t,
  tc,
}) {
  // Unify data extraction from API response
  const dataForRender = useMemo(() => {
    if (Array.isArray(dataArray)) return dataArray
    if (Array.isArray(dataArray?.data)) return dataArray.data
    return []
  }, [dataArray])

  // Filter bank accounts on frontend if needed
  const filteredItems = useMemo(() => {
    if (selectedGrouping !== 'none') return dataForRender

    return dataForRender.filter(item => true) // Add your custom filters here
  }, [dataForRender, selectedGrouping])

  const accountsList = useMemo(() => {
    if (selectedGrouping === 'none') {
      return filteredItems
    }

    return dataForRender.map(group => ({
      ...group,
      isGroup: true,
      guid: group.id || group.guid,
      name: group.name || group.legal_entity_name || tc('noName'),
    }))
  }, [dataForRender, filteredItems, selectedGrouping, tc])

  if (accountsList.length === 0) {
    return (
      <table className={styles.table}>
        <thead className="bg-neutral-100 sticky top-0 z-20 text-neutral-500 font-normal text-xs w-full border-b border-gray-300">
          <tr>
            <th className='w-12'>
              <div className='flex items-center justify-center p-2'>
                <OperationCheckbox onChange={() => { }} />
              </div>
            </th>
            <th className='p-2 text-start font-medium'>
              <div className="flex items-center gap-2">
                {selectedGrouping !== 'none' && (
                  <button
                    onClick={onExpandAll}
                    className="p-1 hover:bg-neutral-200 rounded cursor-pointer transition-colors"
                  >
                    {isAllExpanded ? <ExpendClose /> : <ExpendOpen />}
                  </button>
                )}
                <span>{t('tableHeaders.name')}</span>
              </div>
            </th>
            {ACCOUNT_TABLE_HEADERS.slice(1).map((header) => (
              <th key={header} className='p-2 text-start font-medium'>{t(header)}</th>
            ))}
            <th className='p-2 text-end w-12 pr-4'>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={10} className="p-8  text-neutral-400">
              <span className='text-center'> {t('noData')}</span>
            </td>
          </tr>
        </tbody>
      </table>
    )
  }

  return (
    <table className={styles.table}>
      <thead className="bg-neutral-100 sticky top-0 z-20 text-neutral-500 font-normal text-xs w-full border-b border-gray-300">
        <tr>
          <th className='w-12'>
            <div className='flex items-center justify-center p-2'>
              <OperationCheckbox onChange={() => { }} />
            </div>
          </th>
          <th className='p-2 text-start font-medium'>
            <div className="flex items-center gap-2">
              {/* {selectedGrouping !== 'none' && (
                <button
                  onClick={onExpandAll}
                  className="p-1 hover:bg-neutral-200 rounded cursor-pointer transition-colors"
                >
                  {isAllExpanded ? <ExpendClose /> : <ExpendOpen />}
                </button>
              )} */}
              <span>{t('tableHeaders.name')}</span>
            </div>
          </th>
          {ACCOUNT_TABLE_HEADERS.slice(1).map((header) => (
            <th key={header} className='p-2 text-start font-medium text-nowrap'>{t(header)}</th>
          ))}
          <th className='p-2 text-end w-12 pr-4'>&nbsp;</th>
        </tr>
      </thead>
      <tbody className="bg-white">
        {accountsList.map((item) => {
          if (item.isGroup) {
            const isExpanded = expandedGroups.has(item.guid)
            return (
              <GroupTableRow
                key={item.guid}
                group={item}
                isExpanded={isExpanded}
                onToggle={onToggleGroup}
                onEdit={() => onGroupEdit(item)}
                onDelete={() => onGroupDelete(item)}
                onAccountEdit={onAccountEdit}
                onAccountDelete={onAccountDelete}
              />
            )
          }

          return (
            <AccountTableRow
              key={item.guid}
              account={item}
              onEdit={() => onAccountEdit(item)}
              onDelete={() => onAccountDelete(item)}
            />
          )
        })}
      </tbody>
    </table>
  )
}

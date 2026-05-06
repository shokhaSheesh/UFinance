import { keepPreviousData } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import GroupSelect from '../../shared/Selects/GroupSelect'

const SelectMyAccoutGroup = ({
  value,
  onChange,
  placeholder,
  className,
  dropdownClassName,
  hasError,
  returnParentId = false,
  onReturnParentId
}) => {
  const t = useTranslations('Common')
  const tr = useTranslations('Reports.common')

  const { data: accountsData, isLoading } = useUcodeRequestQuery({
    method: "get_my_accounts",
    data: {
      page: 1,
      limit: 100,
    },
    querySetting: {
      select: (response) => response?.data?.data || [],
      staleTime: 1000 * 60 * 30, // 30 minutes
      placeholder: keepPreviousData
    }
  })

  // Transform accounts data to group by legal_entity_name
  // GroupSelect expects: { value, label, groupName }
  const mappedData = useMemo(() => {
    return (accountsData || []).map(item => ({
      value: item.guid,
      label: item.nazvanie,
      groupId: item.legal_entity_id,
      groupName: item.legal_entity_name || 'Без юрлица'
    }))
  }, [accountsData])

  // Group data by groupId for checking full selection
  const groupedByParent = useMemo(() => {
    const groups = {}
    mappedData.forEach(item => {
      const parentId = item.groupId
      if (!groups[parentId]) {
        groups[parentId] = []
      }
      groups[parentId].push(item.value)
    })
    return groups
  }, [mappedData])

  // Check if all children of a parent are selected
  const isGroupFullySelected = useCallback((parentId, selectedValues) => {
    const children = groupedByParent[parentId] || []
    if (children.length === 0) return false
    return children.every(childId => selectedValues.includes(childId))
  }, [groupedByParent])

  // Handle selection change - always return selectedValues, return parent IDs via onReturnParentId when enabled
  const handleOnChange = useCallback((selectedValues) => {
    // Always return original selected values (account GUIDs)
    onChange?.(selectedValues)

    // If returnParentId is enabled, find and return parent IDs via callback
    if (returnParentId && onReturnParentId) {
      // Find which parents have all children selected
      const parentIdsToReturn = []

      // Check each parent group
      Object.keys(groupedByParent).forEach(parentId => {
        if (isGroupFullySelected(parentId, selectedValues)) {
          parentIdsToReturn.push(parentId)
        }
      })

      // Call the callback with parent IDs if any fully selected groups found
      if (parentIdsToReturn.length > 0) {
        onReturnParentId(parentIdsToReturn)
      } else {
        onReturnParentId([])
      }
    }
  }, [groupedByParent, isGroupFullySelected, returnParentId, onChange, onReturnParentId])

  if (isLoading) {
    return <div className="text-xs text-neutral-400 flex items-center h-10 px-3 border border-neutral-200 rounded-md bg-neutral-50 animate-pulse">{t('loading')}</div>
  }

  return (
    <GroupSelect
      data={mappedData}
      value={value || []}
      onChange={handleOnChange}
      placeholder={placeholder || tr('legalEntitiesAndAccounts')}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
    />
  )
}

export default SelectMyAccoutGroup;

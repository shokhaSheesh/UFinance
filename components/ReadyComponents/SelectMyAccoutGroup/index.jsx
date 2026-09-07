import CreateMyAccountModal from '@/components/directories/CreateMyAccountModal/CreateMyAccountModal'
import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import { appStore } from '../../../store/app.store'
import GroupSelect from '../../shared/Selects/GroupSelect'

const SelectMyAccoutGroup = ({
  value,
  onChange,
  placeholder,
  className,
  dropdownClassName,
  hasError,
  returnParentId = false,
  onReturnParentId,
  dropdownHeaderItem
}) => {
  const t = useTranslations('Common')
  const tr = useTranslations('Reports.common')
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSearch = useMemo(() =>
    debounce((val) => setDebouncedSearch(val), 500),
    [])

  useEffect(() => {
    return () => handleSearch.cancel()
  }, [handleSearch])

  const { data: accountsData, isLoading, isFetching } = useUcodeRequestQuery({
    method: "get_my_accounts",
    data: {
      page: 1,
      limit: 100,
      search: debouncedSearch
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
    // Счета, закрытые для роли — см. utils/accountPermissions.js
    return appStore.filterAllowedAccounts(accountsData || []).map(item => ({
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


  const createAccountHeader = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary hover:bg-primary/5 transition-colors cursor-pointer border-b border-gray-100"
    >
      <Plus size={16} />
      {t('createAccount')}
    </button>
  )

  const combinedHeaderItem = (
    <>
      {createAccountHeader}
      {dropdownHeaderItem}
    </>
  )

  return (
    <>
      <GroupSelect
        data={mappedData}
        value={value || []}
        onChange={handleOnChange}
        placeholder={isLoading ? t('loading') : placeholder || tr('legalEntitiesAndAccounts')}
        className={className}
        dropdownClassName={dropdownClassName}
        hasError={hasError}
        onSearch={handleSearch}
        isSearching={isFetching}
        dropdownHeaderItem={combinedHeaderItem}
      />
      <CreateMyAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

export default SelectMyAccoutGroup;

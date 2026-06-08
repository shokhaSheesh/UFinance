import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import CreateCounterpartyModal from '../../directories/CreateCounterpartyModal/CreateCounterpartyModal'
import MultiSelect from '../../shared/Selects/MultiSelect'

const SelectCounterParties = ({
  value,
  onChange,
  placeholder,
  className,
  childFieldName,
  returnFieldValue,
  dropdownClassName,
  hasError,
  isClearable = true,
  disabled = false,
  dropdownHeaderItem
}) => {
  const t = useTranslations('Common')
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSearch = useMemo(() =>
    debounce((val) => setDebouncedSearch(val), 500),
    [])

  useEffect(() => {
    return () => handleSearch.cancel()
  }, [handleSearch])

  const { data: counterpartiesData, isLoading, isFetching } = useUcodeRequestQuery({
    method: "get_counterparties_group",
    data: {
      page: 1,
      limit: 100,
      search: debouncedSearch
    },
    querySetting: {
      select: (response) => response?.data?.data || [],
      staleTime: 1000 * 60 * 30, // 30 minutes
      placeholderData: keepPreviousData
    }
  })

  const mappedData = useMemo(() => {
    // Flatten tree structure: groups with children
    const items = []
    const groups = Array.isArray(counterpartiesData) ? counterpartiesData : []

    groups.forEach(group => {
      if (group.children && Array.isArray(group.children) && group.children.length > 0) {
        // Add group items
        group.children.forEach(child => {
          items.push({
            value: child.guid,
            label: child.nazvanie || t('noName'),
            group: group.nazvanie_gruppy
          })
        })
      }
    })

    return items
  }, [counterpartiesData, t])

  if (isLoading) {
    return <div className="text-xs text-neutral-400 flex items-center h-10 px-3 border border-neutral-200 rounded-md bg-neutral-50">{t('loading')}</div>
  }

  const createCounterpartyHeader = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary hover:bg-primary/5 transition-colors cursor-pointer border-b border-gray-100"
    >
      <Plus size={16} />
      {t('createCounterparties')}
    </button>
  )

  const combinedHeaderItem = (
    <>
      {createCounterpartyHeader}
      {dropdownHeaderItem}
    </>
  )

  return (
    <>
      <MultiSelect
        data={mappedData}
        value={value}
        onChange={onChange}
        placeholder={placeholder || t('placeholders.selectCounterparty')}
        className={className}
        dropdownClassName={dropdownClassName}
        hasError={hasError}
        isClearable={isClearable}
        disabled={disabled}
        onSearch={handleSearch}
        isSearching={isFetching}
        dropdownHeaderItem={combinedHeaderItem}
      />
      <CreateCounterpartyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

export default SelectCounterParties

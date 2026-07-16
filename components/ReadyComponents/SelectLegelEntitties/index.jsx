import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import CreateLegalEntityModal from '../../directories/CreateLegalEntityModal/CreateLegalEntityModal'
import MultiSelect from '../../shared/Selects/MultiSelect'
import SingleSelect from '../../shared/Selects/SingleSelect'

const SelectLegelEntitties = ({ value, onChange, placeholder, className, childFieldName, returnFieldValue, returnLabel, dropdownClassName, multi = false, hasError, isClearable = true, disabled = false, dropdownHeaderItem }) => {
  const t = useTranslations('Common')
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSearch = useMemo(() =>
    debounce((val) => setDebouncedSearch(val), 500),
    [])

  useEffect(() => {
    return () => handleSearch.cancel()
  }, [handleSearch])

  const { data: legalEntitiesData, isLoading, isFetching } = useUcodeRequestQuery({
    method: "get_legal_entities",
    data: {
      search: debouncedSearch
    },
    querySetting: {
      select: (response) => response?.data?.data || [],
      staleTime: 1000 * 60 * 30, // 30 minutes
      placeholder: keepPreviousData
    }
  })

  const mappedData = useMemo(() => {
    return (legalEntitiesData || []).map(item => ({
      value: item.guid,
      label: item.nazvanie || t('noName')
    }))
  }, [legalEntitiesData, t])



  const Component = multi ? MultiSelect : SingleSelect;

  // Pass the selected legal-entity name up (for contract templates etc.)
  const handleChange = (val) => {
    onChange?.(val)
    if (returnLabel) {
      const found = (mappedData || []).find((i) => i.value === val)
      returnLabel(found?.label ?? '')
    }
  }

  const createLegalEntityHeader = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary hover:bg-primary/5 transition-colors cursor-pointer border-b border-gray-100"
    >
      <Plus size={16} />
      {t('createLegalEntity')}
    </button>
  )

  const combinedHeaderItem = (
    <>
      {dropdownHeaderItem || createLegalEntityHeader}
    </>
  )

  return (
    <>
      <Component
        data={mappedData}
        value={value}
        onChange={handleChange}
        placeholder={isLoading ? t('loading') : placeholder || t('placeholders.selectLegalEntity')}
        className={className}
        dropdownClassName={dropdownClassName}
        hasError={hasError}
        isClearable={isClearable}
        disabled={disabled}
        onSearch={handleSearch}
        isSearching={isFetching}
        dropdownHeaderItem={combinedHeaderItem}
      />
      <CreateLegalEntityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

export default SelectLegelEntitties;
import CreateCounterpartyModal from '@/components/directories/CreateCounterpartyModal/CreateCounterpartyModal'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { useCounterpartiesGroupsPlanFact } from '@/hooks/useDashboard'
import { debounce } from 'lodash'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import MultiSelect from '../../shared/Selects/MultiSelect'

const SelectCounterPartyGroup = ({ value, onChange, placeholder, className, hasError, isClearable = true, multi = false, dropdownHeaderItem }) => {
  const t = useTranslations('Common')
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSearch = useMemo(() =>
    debounce((val) => setDebouncedSearch(val), 500),
    [])

  useEffect(() => {
    return () => handleSearch.cancel()
  }, [handleSearch])

  const { data: counterpartiesGroupsData, isLoading, isFetching } = useCounterpartiesGroupsPlanFact({ page: 1, limit: 100, search: debouncedSearch })

  const counterpartiesGroupsOptions = useMemo(() => {
    const items = counterpartiesGroupsData?.data?.data || []
    if (!items || items.length === 0) return []
    return items.filter(item => item.nazvanie_gruppy !== 'Контрагенты без группы').map(item => ({
      value: item.guid,
      label: item.nazvanie_gruppy || t('noName')
    }))
  }, [counterpartiesGroupsData, t])

  const actualPlaceholder = isLoading ? t('loading') : (placeholder || t('placeholders.selectCounterpartyGroup'))
  const Component = multi ? MultiSelect : SingleSelect;

  const createCounterpartyGroupHeader = (
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
      {createCounterpartyGroupHeader}
      {dropdownHeaderItem}
    </>
  )
  return (
    <>
      <Component
        data={counterpartiesGroupsOptions}
        value={value}
        onChange={onChange}
        placeholder={actualPlaceholder}
        className={className}
        hasError={hasError}
        isClearable={isClearable}
        onSearch={handleSearch}
        isSearching={isFetching}
        dropdownHeaderItem={combinedHeaderItem}
      />
      <CreateCounterpartyModal
        isOpen={isModalOpen}
        activetab='group'
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

export default SelectCounterPartyGroup

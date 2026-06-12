import CreateAccountGroupModal from '@/components/directories/CreateAccountGroupModal/CreateAccountGroupModal'
import MultiSelect from '@/components/shared/Selects/MultiSelect'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

const SelectAccountGroups = ({ value, onChange, placeholder, className, dropdownClassName, multi = false, hasError, dropdownHeaderItem }) => {
  const t = useTranslations('Common')
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSearch = useMemo(() =>
    debounce((val) => setDebouncedSearch(val), 500),
    [])

  useEffect(() => {
    return () => handleSearch.cancel()
  }, [handleSearch])

  const { data: groupsData, isLoading, isFetching } = useUcodeRequestQuery({
    method: "get_account_groups",
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

  const mappedData = useMemo(() => {
    return (groupsData || []).map(item => ({
      value: item.guid,
      label: item.name || item.nazvanie || t('noName')
    }))
  }, [groupsData, t])



  const Component = multi ? MultiSelect : SingleSelect;

  const createCounterpartyGroupHeader = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary hover:bg-primary/5 transition-colors cursor-pointer border-b border-gray-100"
    >
      <Plus size={16} />
      {t('createAccountGroup')}
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
        data={mappedData}
        value={value}
        onChange={onChange}
        placeholder={isLoading ? t('loading') : placeholder || t('placeholders.selectGroup')}
        className={className}
        dropdownClassName={dropdownClassName}
        hasError={hasError}
        onSearch={handleSearch}
        isSearching={isFetching}
        dropdownHeaderItem={combinedHeaderItem}
      />
      <CreateAccountGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} />
    </>
  )
}


export default SelectAccountGroups
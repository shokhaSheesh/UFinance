import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import { formatNumber, formatTotalSumma } from '../../../utils/helpers'
import CreateMyAccountModal from '../../directories/CreateMyAccountModal/CreateMyAccountModal'
import MultiSelect from '../../shared/Selects/MultiSelect'
import SingleSelect from '../../shared/Selects/SingleSelect'

const SelectMyAccounts = ({ value, onChange, placeholder, className, dropdownClassName, multi = true, type, selected, hasError, extraValue, returnValue, isClearable, dropdownHeaderItem }) => {
  const t = useTranslations('Common')
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
      search: debouncedSearch
    },
    querySetting: {
      select: (response) => response?.data?.data || [],
      staleTime: 1000 * 60 * 30, // 30 minutes
      placeholder: keepPreviousData
    }
  })

  const mappedData = useMemo(() => {
    const data = (accountsData || []).map(item => ({
      value: item.guid,
      label: type === "show" ? `${item?.nazvanie} [${item?.legal_entity_name}] ${formatNumber(formatTotalSumma(item?.balans))} ${item?.currenies_kod}` : item.nazvanie
    }))

    if (selected) {
      const selectedArray = Array.isArray(selected) ? selected : [selected];
      return data.filter(item => !selectedArray.includes(item.value));
    }

    return data;
  }, [accountsData, type, selected])

  const handleSelect = (value) => {
    onChange?.(value)
    if (returnValue) {
      const matched = (accountsData || []).find(item => item.guid === value);
      if (matched) {
        returnValue?.(matched[extraValue] || t('noName'));
      }
    }
  }


  const Component = multi ? MultiSelect : SingleSelect;

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
      <Component
        data={mappedData}
        value={value}
        onChange={handleSelect}
        placeholder={isLoading ? t('loading') : placeholder || t('placeholders.selectDeals')}
        className={className}
        dropdownClassName={dropdownClassName}
        hasError={hasError}
        isClearable={isClearable}
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

export default SelectMyAccounts;
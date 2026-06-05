import MultiSelect from '@/components/shared/Selects/MultiSelect'
import { debounce } from 'lodash'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'

const SelectCounterParties = ({ value = [], onChange, placeholder, dropdownClassName, className, hasError, dropdownHeaderItem }) => {
  const t = useTranslations('Common')
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const handleSearch = useMemo(() => 
    debounce((val) => setDebouncedSearch(val), 500),
  [])

  useEffect(() => {
    return () => handleSearch.cancel()
  }, [handleSearch])

  const { data: counterpartiesFilterData, isLoading, isFetching } = useUcodeRequestQuery({
    method: "get_counterparties",
    data: {
      page: 1,
      limit: 100,
      search: debouncedSearch
    }
  })

  const counterpartiesOptions = useMemo(() => {
    const items = counterpartiesFilterData?.data?.data || []
    if (!items || items.length === 0) return []
    return items.map(item => ({
      value: item.guid,
      label: item.nazvanie || t('noName')
    }))
  }, [counterpartiesFilterData, t])

  const actualPlaceholder = isLoading ? t('loading') : (placeholder || t('placeholders.selectCounterparties'));

  return (
    <MultiSelect
      data={counterpartiesOptions}
      onSearch={handleSearch}
      value={value}
      onChange={onChange}
      className={className}
      placeholder={actualPlaceholder}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
      isSearching={isFetching}
      dropdownHeaderItem={dropdownHeaderItem}
    />
  )
}

export default SelectCounterParties;
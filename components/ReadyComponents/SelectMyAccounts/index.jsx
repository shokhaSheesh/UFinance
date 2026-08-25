import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import { formatNumber, formatTotalSumma } from '../../../utils/helpers'
import MultiSelect from '../../shared/Selects/MultiSelect'
import SingleSelect from '../../shared/Selects/SingleSelect'

const SelectMyAccounts = ({ value, onChange, placeholder, className, dropdownClassName, multi = true, type, selected, hasError, extraValue, returnValue, isClearable, active }) => {
  const t = useTranslations('Common')
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const handleSearch = useMemo(() =>
    debounce((val) => setDebouncedSearch(val), 500),
    [])

  useEffect(() => {
    return () => handleSearch.cancel()
  }, [handleSearch])

  const { data: accountsData, isLoading, isFetching } = useUcodeRequestQuery({
    method: "get_my_accounts",
    data: {
      search: debouncedSearch,
      ...(active ? { active: true } : {})
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

  const actualPlaceholder = isLoading ? t('loading') : (placeholder || t('placeholders.selectAccount'));

  const Component = multi ? MultiSelect : SingleSelect;

  return (
    <Component
      data={mappedData}
      value={value}
      onChange={handleSelect}
      placeholder={actualPlaceholder}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
      isClearable={isClearable}
      onSearch={handleSearch}
      isSearching={isFetching}
    />
  )
}

export default SelectMyAccounts;
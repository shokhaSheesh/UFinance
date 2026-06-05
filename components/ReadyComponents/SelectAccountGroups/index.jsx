import MultiSelect from '@/components/shared/Selects/MultiSelect'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

const SelectAccountGroups = ({ value, onChange, placeholder, className, dropdownClassName, multi = false, hasError, dropdownHeaderItem }) => {
  const t = useTranslations('Common')
  const [debouncedSearch, setDebouncedSearch] = useState("")

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

  if (isLoading) {
    return <div className="text-xs text-neutral-400 flex items-center h-10 px-3 border border-neutral-200 rounded-md bg-neutral-50 animate-pulse">{t('loading')}</div>
  }

  const Component = multi ? MultiSelect : SingleSelect;

  return (
    <Component
      data={mappedData}
      value={value}
      onChange={onChange}
      placeholder={placeholder || t('placeholders.selectGroup')}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
      onSearch={handleSearch}
      isSearching={isFetching}
      dropdownHeaderItem={dropdownHeaderItem}
    />
  )
}


export default SelectAccountGroups
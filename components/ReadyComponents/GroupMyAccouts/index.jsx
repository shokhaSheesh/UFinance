import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import { appStore } from '../../../store/app.store'
import GroupSelect from '../../shared/Selects/GroupSelect'

const GroupMyAccounts = ({
  value,
  onChange,
  placeholder,
  className,
  dropdownClassName,
  multi = true,
  disabled = false,
  hasError,
  dropdownHeaderItem
}) => {
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
      page: 1,
      limit: 100,
      search: debouncedSearch,
      groupBy: "legal_entities",
      nalichnye: true,
      beznalichnye: true,
      kartaFizlica: true,
      elektronnye: true,
    },
    querySetting: {
      select: (response) => response?.data?.data || [],
      staleTime: 1000 * 60 * 30,
      placeholderData: keepPreviousData
    }
  })

  const mappedData = useMemo(() => {
    // Flatten hierarchical data into the format expected by the select components.
    // Счета, закрытые для роли, отсеиваем — см. utils/accountPermissions.js
    return appStore.filterAllowedAccountGroups(accountsData || []).flatMap(group =>
      (group.children || []).map(account => ({
        value: account.guid,
        label: account.nazvanie,
        groupName: group.name, // Used by GroupSelect (multi)
        group: group.name      // Used by GroupedSelect (single)
      }))
    )
  }, [accountsData])

  if (isLoading) {
    return (
      <div className="text-xs text-neutral-400 flex items-center h-10 px-3 border border-neutral-200 rounded-md bg-neutral-50 cursor-not-allowed">
        {t('loading')}
      </div>
    )
  }



  return (
    <GroupSelect
      data={mappedData}
      disabled={disabled}
      value={Array.isArray(value) ? value : []}
      onChange={onChange}
      multi={multi}
      placeholder={placeholder || t('placeholders.selectAccounts')}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
      onSearch={handleSearch}
      isSearching={isFetching}
      dropdownHeaderItem={dropdownHeaderItem}
    />
  )
}

export default GroupMyAccounts
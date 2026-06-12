import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import TreeSelect from '../../shared/Selects/TreeSelect'

const mapNode = (item) => {
  const idValue = item.guid || item.chart_of_accounts_id_2 || item.id || `fallback-key-${Math.random().toString(36).substring(2, 9)}`

  return {
    value: idValue,
    label: item.nazvanie,
    children: item.children?.map(child => mapNode(child)).filter(Boolean) || []
  }
}

const mapTree = (data) => {
  return data
    ?.map(item => mapNode(item))
    .filter(Boolean)
}

const SelectStatiya = ({ selectedValue, setSelectedValue, placeholder, className, shownParent, hasError, dropdownHeaderItem }) => {
  const t = useTranslations('Common')
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const handleSearch = useMemo(() =>
    debounce((val) => setDebouncedSearch(val), 500),
    [])

  useEffect(() => {
    return () => handleSearch.cancel()
  }, [handleSearch])

  const { data: chartOfAccountsData, isFetching } = useUcodeRequestQuery({
    method: "get_chart_of_accounts",
    data: {
      page: 1,
      limit: 100,
      search: debouncedSearch
    },
    querySetting: {
      select: (res) => res?.data?.data,
      staleTime: 1000 * 60 * 30,
      placeholderData: keepPreviousData
    }
  })

  const result = useMemo(() => {
    if (shownParent && chartOfAccountsData) {
      const parentNode = chartOfAccountsData.find(item => item.nazvanie === shownParent)
      if (parentNode && parentNode.children) {
        return parentNode.children
          .map(child => mapNode(child))
          .filter(Boolean)
      }
      return []
    }
    return mapTree(chartOfAccountsData)
  }, [chartOfAccountsData, shownParent])

  const handleSelect = (val) => {
    setSelectedValue?.(val);
  }

  return <TreeSelect
    data={result}
    multi={false}
    placeholder={isFetching ? t('loading') : placeholder || t('placeholders.selectStatiya')}
    value={selectedValue}
    onChange={handleSelect}
    hasError={hasError}
    className={className}
    onSearch={handleSearch}
    isSearching={isFetching}
    dropdownHeaderItem={dropdownHeaderItem}
  />
}

export default SelectStatiya
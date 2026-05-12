import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import TreeSelect from '../../shared/Selects/TreeSelect'

const NOT_SELECTABLE = new Set([
  'Доходы',
  'Расходы',
  'Актив',
  'Оборотные активы',
  'Другие оборотные',
  'Внеоборотные активы',
  'Основные средства',
  'Другие внеоборотные',
  'Обязательства',
  'Краткосрочные обязательства',
  'Другие краткосрочные',
  'Долгосрочные обязательства',
  'Другие долгосрочные',
  'Капитал',
  'Другие статьи капитала'
])

const mapNode = (item, type) => {
  const isDisabled = NOT_SELECTABLE.has(item.nazvanie)

  return item?.nazvanie === type ? null : {
    value: item.guid || item.chart_of_accounts_id_2 || item.id || `fallback-key-${Math.random().toString(36).substring(2, 9)}`,
    label: item.nazvanie,
    bold: isDisabled,
    children: item.children?.map(child => mapNode(child, type)).filter(Boolean) || []
  }
}

const mapTree = (data, type) => {
  if (!data) return []
  return data
    ?.filter(item => !type || item.nazvanie !== type)
    .map(item => mapNode(item, type))
    .filter(Boolean)
}

const MultiSelectStatiya = ({ value = [], onChange, placeholder, className, type = "", dropdownClassName, hasError }) => {
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
      staleTime: 1000 * 60 * 30, // 30 minutes
      placeholder: keepPreviousData
    }
  })

  const result = useMemo(() => {
    return mapTree(chartOfAccountsData, type)
  }, [chartOfAccountsData, type])

  return (
    <TreeSelect
      data={result}
      multi={true}
      placeholder={placeholder || t('placeholders.selectStatii')}
      value={value}
      onChange={onChange}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
      onSearch={handleSearch}
      isSearching={isFetching}
    />
  )
}

export default MultiSelectStatiya;
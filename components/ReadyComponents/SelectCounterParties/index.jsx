import React, { useMemo, useState, useEffect } from 'react'
import MultiSelect from '@/components/shared/Selects/MultiSelect'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import { debounce } from 'lodash'

const SelectCounterParties = ({ value = [], onChange, placeholder = "Выберите контрагентов", dropdownClassName, className, hasError }) => {
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const handleSearch = useMemo(() => 
    debounce((val) => setDebouncedSearch(val), 500),
  [])

  useEffect(() => {
    return () => handleSearch.cancel()
  }, [handleSearch])

  const { data: counterpartiesFilterData, isLoading } = useUcodeRequestQuery({
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
      label: item.nazvanie || 'Без названия'
    }))
  }, [counterpartiesFilterData])

  const actualPlaceholder = isLoading ? "Загрузка..." : placeholder;

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
    />
  )
}

export default SelectCounterParties;
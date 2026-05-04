'use client'
import MultiSelect from '@/components/shared/Selects/MultiSelect'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useEffect, useMemo, useState } from 'react'

const SalesTransactions = ({ value = [], onChange, placeholder = "Выберите сделки", dropdownClassName, hasError }) => {
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const handleSearch = useMemo(() =>
    debounce((val) => setDebouncedSearch(val), 500),
  [])

  useEffect(() => {
    return () => handleSearch.cancel()
  }, [handleSearch])

  const { data: dealsData, isLoading } = useUcodeRequestQuery({
    method: 'get_sales_list_simple',
    data: {
      page: 1,
      limit: 100,
      search: debouncedSearch
    },
    querySetting: {
      select: (response) => response?.data?.data,
      staleTime: 1000 * 60 * 30,
      placeholder: keepPreviousData
    }
  })

  const formattedDeals = useMemo(() => {
    const items = Array.isArray(dealsData) ? dealsData : []
    return items.map(deal => ({
      value: deal.guid,
      label: deal.Nazvanie || deal.name || 'Без названия',
    }))
  }, [dealsData])

  return (
    <MultiSelect
      data={formattedDeals}
      onSearch={handleSearch}
      value={value}
      onChange={onChange}
      placeholder={isLoading ? "Загрузка..." : placeholder}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
    />
  )
}

export default SalesTransactions;

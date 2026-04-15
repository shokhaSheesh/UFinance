'use client'
import React, { useMemo } from 'react'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import MultiSelect from '../../shared/Selects/MultiSelect'
import { keepPreviousData } from '@tanstack/react-query'

const MultiSelectZdelka = ({
  value = [],
  onChange = () => { },
  placeholder = 'Выберите сделки',
  className,
  dropdownClassName,
  hasError
}) => {
  const { data: deals, isLoading } = useUcodeRequestQuery({
    method: "get_sales_list_simple",
    data: { 
      page: 1,
      limit: 100,
    },
    querySetting: {
      select: (response) => response?.data?.data,
      staleTime: 1000 * 60 * 30, // 30 minutes
      placeholder: keepPreviousData
    }
  })

  const options = useMemo(() => {
    if (!deals || !Array.isArray(deals)) return []

    return deals.map(deal => ({
      value: deal.guid,
      label: deal?.Nazvanie || 'Без названия'
    }))
  }, [deals])

  return (
    <MultiSelect
      data={options}
      value={Array.isArray(value) ? value : []}
      onChange={onChange}
      placeholder={isLoading ? "Загрузка..." : placeholder}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
    />
  )
}

export default MultiSelectZdelka

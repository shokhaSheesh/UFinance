'use client'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { keepPreviousData } from '@tanstack/react-query'
import { useMemo } from 'react'
import SingleSelect from '../../shared/Selects/SingleSelect'

const SingleZdelka = ({
  value,
  onChange,
  placeholder = 'Выберите сделку',
  className,
  dropdownClassName,
  hasError,
  withSearch = true
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

    return deals?.map(deal => ({
      value: deal.guid,
      label: deal?.Nazvanie || 'Без названия'
    }))
  }, [deals])

  return (
    <SingleSelect
      data={options}
      withSearch={withSearch}
      value={value}
      onChange={onChange}
      placeholder={isLoading ? "Загрузка..." : placeholder}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
    />
  )
}

export default SingleZdelka;
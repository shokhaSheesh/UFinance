import React, { useMemo } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import MultiSelect from '../../shared/Selects/MultiSelect'
import SingleSelect from '../../shared/Selects/SingleSelect'
import { productServiceDto } from '../../../lib/dtos/productServiceDto'
import { keepPreviousData } from '@tanstack/react-query'

const SelectProductService = ({
  value,
  onChange,
  placeholder = "Выберите товар или услугу",
  className,
  dropdownClassName,
  multi = false,
  selected,
  sellingDealId,
  hasError
}) => {

  const { data: productsData, isLoading } = useUcodeRequestQuery({
    method: "list_products_and_services",
    data: {
      sales_transaction_id: sellingDealId,
    },
    querySetting: {
      select: (response) => productServiceDto(response?.data?.data) || [],
      staleTime: 1000 * 60 * 30, // 30 minutes
      placeholder: keepPreviousData
    }
  })

  const mappedData = useMemo(() => {
    const data = (productsData || []).map(item => ({
      value: item.guid,
      label: item.name
    }))

    if (selected) {
      const selectedArray = Array.isArray(selected) ? selected : [selected];
      return data.filter(item => !selectedArray.includes(item.value));
    }

    return data;
  }, [productsData, selected])

  if (isLoading) {
    return <div className="text-xs text-neutral-400 flex items-center h-10 px-3 border border-neutral-200 rounded-md bg-neutral-50">Загрузка...</div>
  }

  const Component = multi ? MultiSelect : SingleSelect;

  return (
    <Component
      data={mappedData}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
    />
  )
}

export default SelectProductService;
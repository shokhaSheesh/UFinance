import React, { useMemo } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import MultiSelect from '../../shared/Selects/MultiSelect'
import SingleSelect from '../../shared/Selects/SingleSelect'
import { formatNumber, formatTotalSumma } from '../../../utils/helpers'
import { keepPreviousData } from '@tanstack/react-query'

const SelectMyAccounts = ({ value, onChange, placeholder = "Выберите счет", className, dropdownClassName, multi = true, type, selected, hasError, extraValue, returnValue }) => {

  const { data: accountsData, isLoading } = useUcodeRequestQuery({
    method: "get_my_accounts",
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
        returnValue?.(matched[extraValue] || 'Без названия');
      }
    }
  }

  if (isLoading) {
    return <div className="text-xs text-neutral-400 flex items-center h-10 px-3 border border-neutral-200 rounded-md bg-neutral-50">Загрузка...</div>
  }

  const Component = multi ? MultiSelect : SingleSelect;

  return (
    <Component
      data={mappedData}
      value={value}
      onChange={handleSelect}
      placeholder={placeholder}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
    />
  )
}

export default SelectMyAccounts;
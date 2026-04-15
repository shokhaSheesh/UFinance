import React, { useMemo } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import MultiSelect from '../../shared/Selects/MultiSelect'
import SingleSelect from '../../shared/Selects/SingleSelect'
import { keepPreviousData } from '@tanstack/react-query'

const SelectMyAccoutGroup = ({ value, onChange, placeholder = "Выберите группу", className, dropdownClassName, multi = false, hasError }) => {

  const { data: groupsData, isLoading } = useUcodeRequestQuery({
    method: "get_account_groups",
    data: {
      page: 1,
      limit: 100,
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
      label: item.name || item.nazvanie || 'Без названия'
    }))
  }, [groupsData])

  if (isLoading) {
    return <div className="text-xs text-neutral-400 flex items-center h-10 px-3 border border-neutral-200 rounded-md bg-neutral-50 animate-pulse">Загрузка...</div>
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

export default SelectMyAccoutGroup;

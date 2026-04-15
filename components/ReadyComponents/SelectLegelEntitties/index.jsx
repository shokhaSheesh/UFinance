import React, { useMemo } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import MultiSelect from '../../shared/Selects/MultiSelect'
import SingleSelect from '../../shared/Selects/SingleSelect'
import { keepPreviousData } from '@tanstack/react-query'

const SelectLegelEntitties = ({ value, onChange, placeholder = "Выберите юрлицо", className, childFieldName, returnFieldValue, dropdownClassName, multi = false, hasError, isClearable = true }) => {

  const { data: legalEntitiesData, isLoading } = useUcodeRequestQuery({
    method: "get_legal_entities",
    querySetting: {
      select: (response) => response?.data?.data || [],
      staleTime: 1000 * 60 * 30, // 30 minutes
      placeholder: keepPreviousData
    }
  })

  const mappedData = useMemo(() => {
    return (legalEntitiesData || []).map(item => ({
      value: item.guid,
      label: item.nazvanie || 'Без названия'
    }))
  }, [legalEntitiesData])


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
      isClearable={isClearable}
    />
  )
}

export default SelectLegelEntitties;
import { keepPreviousData } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import GroupSelect from '../../shared/Selects/GroupSelect'

const SelectMyAccoutGroup = ({ value, onChange, placeholder = "Юрлица и счета", className, dropdownClassName, hasError }) => {

  const { data: accountsData, isLoading } = useUcodeRequestQuery({
    method: "get_my_accounts",
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

  // Transform accounts data to group by legal_entity_name
  // GroupSelect expects: { value, label, groupName }
  const mappedData = useMemo(() => {
    return (accountsData || []).map(item => ({
      value: item.guid,
      label: item.nazvanie,
      groupName: item.legal_entity_name || 'Без юрлица'
    }))
  }, [accountsData])

  if (isLoading) {
    return <div className="text-xs text-neutral-400 flex items-center h-10 px-3 border border-neutral-200 rounded-md bg-neutral-50 animate-pulse">Загрузка...</div>
  }

  return (
    <GroupSelect
      data={mappedData}
      value={value || []}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
    />
  )
}

export default SelectMyAccoutGroup;

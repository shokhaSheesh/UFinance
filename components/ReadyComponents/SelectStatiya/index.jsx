import { useMemo } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import TreeSelect from '../../shared/Selects/TreeSelect'
import { keepPreviousData } from '@tanstack/react-query'

const mapNode = (item) => {
  const idValue = item.guid || item.chart_of_accounts_id_2 || item.id || `fallback-key-${Math.random().toString(36).substring(2, 9)}`

  return {
    value: idValue,
    label: item.nazvanie,
    children: item.children?.map(child => mapNode(child)).filter(Boolean) || []
  }
}

const mapTree = (data) => {
  return data
    ?.map(item => mapNode(item))
    .filter(Boolean)
}

const SelectStatiya = ({ selectedValue, setSelectedValue, placeholder = 'Выберите статью', className, shownParent, hasError }) => {

  const { data: chartOfAccountsData } = useUcodeRequestQuery({
    method: "get_chart_of_accounts",
    data: {
      page: 1,
      limit: 100,
    },
    querySetting: {
      select: (res) => res?.data?.data,
      staleTime: 1000 * 60 * 60, // 1 hour
      placeholder: keepPreviousData
    }
  })

  const result = useMemo(() => {
    if (shownParent && chartOfAccountsData) {
      const parentNode = chartOfAccountsData.find(item => item.nazvanie === shownParent)
      if (parentNode && parentNode.children) {
        return parentNode.children
          .map(child => mapNode(child))
          .filter(Boolean)
      }
      return []
    }
    return mapTree(chartOfAccountsData)
  }, [chartOfAccountsData, shownParent])

  const handleSelect = (val) => {
    setSelectedValue?.(val);
  }

  return <TreeSelect
    data={result}
    multi={false}
    placeholder={placeholder}
    value={selectedValue}
    onChange={handleSelect}
    hasError={hasError}
    className={className}
  />
}

export default SelectStatiya
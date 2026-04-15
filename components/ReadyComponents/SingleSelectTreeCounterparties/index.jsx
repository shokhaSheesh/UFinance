import { useMemo } from 'react'
import { useCounterpartiesGroupsPlanFact } from '../../../hooks/useDashboard'
import TreeSelect from '../../shared/Selects/TreeSelect'

const SingleSelectTreeCounterparties = ({ selectedValue, setSelectedValue, placeholder = 'Выберите контрагента...', className, dropdownClassName, hasError }) => {

  const { data: counterpartiesGroupsData } = useCounterpartiesGroupsPlanFact({
    page: 1,
    limit: 100,
    
  })

  const result = useMemo(() => {
    const groups = counterpartiesGroupsData?.data?.data || []

    if (groups.length === 0) return []

    const buildTree = item => {
      // Check if this is a group with children
      if (item.children && Array.isArray(item.children) && item.children.length > 0) {
        return {
          value: item.guid,
          label: item.nazvanie_gruppy || 'Без названия',
          isSelectable: false, // Groups are not selectable
          bold: true,
          children: item.children.map(child => ({
            value: child.guid,
            label: child.nazvanie || 'Без названия',
            isSelectable: true,
          }))
        }
      }

      // This is a standalone item (no children)
      return {
        value: item.guid,
        label: item.nazvanie_gruppy || item.nazvanie || 'Без названия',
        isSelectable: true,
      }
    }

    return groups.map(buildTree)
  }, [counterpartiesGroupsData])

  return <TreeSelect
    data={result}
    multi={false}
    placeholder={placeholder}
    value={selectedValue}
    onChange={setSelectedValue}
    className={className}
    dropdownClassName={dropdownClassName}
    hasError={hasError}
  />
}

export default SingleSelectTreeCounterparties
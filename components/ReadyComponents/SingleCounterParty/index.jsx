'use client'
import React, { useEffect, useMemo } from 'react'
import { useCounterpartiesGroupsPlanFact } from '@/hooks/useDashboard'
import TreeSelect from '../../shared/Selects/TreeSelect'

const SingleCounterParty = ({
  value,
  onChange,
  placeholder = 'Выберите контрагента',
  className,
  disabled,
  dropdownClassName,
  name = '',
  returnChartOfAccount,
  isClearable = true,
  hasError
}) => {
  const { data: counterpartiesGroupsData, isLoading } = useCounterpartiesGroupsPlanFact({
    page: 1,
    limit: 1000,
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
          bold: true,
          isSelectable: false, // Groups are not selectable
          children: item.children.map(child => ({
            value: child.guid,
            label: child.nazvanie || 'Без названия',
            isSelectable: true,
            rawData: child // Store raw data for lookup
          }))
        }
      }

      // This is a standalone item (no children)
      return {
        value: item.guid,
        label: item.nazvanie_gruppy || item.nazvanie || 'Без названия',
        isSelectable: true,
        rawData: item // Store raw data for lookup
      }
    }

    return groups.filter(item => item.children && item.children.length > 0).map(buildTree)
  }, [counterpartiesGroupsData])

  const autoSelectChartOfAccount = (name, val) => {
    // Find the item in the tree to get its rawData
    const findItem = (nodes) => {
      for (const node of nodes) {
        if (node.value === val) return node
        if (node.children) {
          const found = findItem(node.children)
          if (found) return found
        }
      }
      return null
    }

    const node = findItem(result)
    if (node && node.rawData) {
      // Return the chart_of_accounts_id (or id_2) based on the 'name' prop
      const accountId = node.rawData[name]
      console.log('accountId', accountId)
      returnChartOfAccount?.(accountId || null)

    }
  }


  // useEffect(() => {
  //   if (name) {
  //     autoSelectChartOfAccount(name, value)
  //   }
  // }, [name])

  const handleSelect = (val) => {
    onChange(val)
    if (name && val) {
      // Find the item in the tree to get its rawData
      autoSelectChartOfAccount(name, val)
    }
  }

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none w-full' : 'w-full'}>
      <TreeSelect
        data={result}
        multi={false}
        placeholder={isLoading ? "Загрузка..." : placeholder}
        value={value}
        onChange={handleSelect}
        isClearable={isClearable}
        className={className}
        dropdownClassName={dropdownClassName}
        hasError={hasError}
      />
    </div>
  )
}

export default SingleCounterParty;

import { keepPreviousData } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import TreeSelect from '../../shared/Selects/TreeSelect'

const NOT_SELECTABLE = new Set([
  'Доходы',
  'Расходы',
  'Актив',
  'Оборотные активы',
  'Другие оборотные',
  'Внеоборотные активы',
  'Основные средства',
  'Другие внеоборотные',
  'Обязательства',
  'Краткосрочные обязательства',
  'Другие краткосрочные',
  'Долгосрочные обязательства',
  'Другие долгосрочные',
  'Капитал',
  'Другие статьи капитала',
  'Другие долгосрочные '
])

const HIDDEN_VALES = new Set([
  'Денежная',
  'Неденежная'
])


const mapNode = (item, type, hiddenValue) => {
  const isDisabled = NOT_SELECTABLE.has(item.nazvanie)
  const idValue = item.guid || item.chart_of_accounts_id_2 || item.id || `fallback-key-${Math.random().toString(36).substring(2, 9)}`

  if (item?.nazvanie === type || idValue === hiddenValue || HIDDEN_VALES.has(item?.nazvanie)) return null

  return {
    value: idValue,
    label: item.nazvanie,
    bold: isDisabled,
    isSelectable: !isDisabled,
    children: item.children?.map(child => mapNode(child, type, hiddenValue)).filter(Boolean) || []
  }
}

const mapTree = (data, type, hiddenValue) => {
  return data
    ?.filter(item => item.nazvanie !== type && !HIDDEN_VALES.has(item?.nazvanie)) // 
    .map(item => mapNode(item, type, hiddenValue))
    .filter(Boolean)
}

const SinglSelectStatiya = ({ selectedValue, setSelectedValue, placeholder = 'Выберите статью', className, type = "Расходы", dropdownClassName, parent, returnIsChild, hiddenValue, hasError, isClearable = true, handleReturnName, disabled = false }) => {

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
    return mapTree(chartOfAccountsData, type, hiddenValue)
  }, [chartOfAccountsData, type, hiddenValue])

  // Flattened map to track ancestry by value
  const flattenedAncestry = useMemo(() => {
    const flat = {};
    const traverse = (nodes, ancestors = []) => {
      nodes.forEach(node => {
        const id = node.guid || node.chart_of_accounts_id_2 || node.id || node.value;
        const currentAncestors = [...ancestors, node.label || node.nazvanie];
        flat[id] = currentAncestors;
        if (node.children) traverse(node.children, currentAncestors);
      });
    };
    if (result) traverse(result);
    return flat;
  }, [result])

  // Find label by value from tree data
  const findLabelByValue = (nodes, value) => {
    for (const node of nodes) {
      if (node.value === value) return node.label
      if (node.children) {
        const found = findLabelByValue(node.children, value)
        if (found) return found
      }
    }
    return null
  }

  useEffect(() => {
    if (selectedValue && returnIsChild) {
      const ancestors = flattenedAncestry[selectedValue] || [];
      const parentArray = Array.isArray(parent) ? parent : [parent];
      // Check if any ancestor matches any of the parent names
      const isDescendant = ancestors.some(name => parentArray.includes(name));
      returnIsChild(isDescendant);
    }
  }, [selectedValue, flattenedAncestry, parent, returnIsChild])

  useEffect(() => {
    if (selectedValue) {
      const ancestors = flattenedAncestry[selectedValue] || [];
      if (!ancestors?.length) {
        setSelectedValue('')
      }
    }
  }, [selectedValue, flattenedAncestry, parent, returnIsChild, setSelectedValue])

  // Return selected item label when value changes
  useEffect(() => {
    if (handleReturnName && result) {
      // Inline label lookup to avoid dependency issues
      const findLabel = (nodes, val) => {
        for (const node of nodes) {
          if (node.value === val) return node.label
          if (node.children) {
            const found = findLabel(node.children, val)
            if (found) return found
          }
        }
        return null
      }
      const label = selectedValue ? findLabel(result, selectedValue) : ''
      handleReturnName(label || '')
    }
  }, [selectedValue, result, handleReturnName])

  const handleSelect = (val) => {
    setSelectedValue?.(val);
    if (parent && returnIsChild) {
      const ancestors = flattenedAncestry[val] || [];
      const parentArray = Array.isArray(parent) ? parent : [parent];
      // Check if any ancestor matches any of the parent names
      const isDescendant = ancestors.some(name => parentArray.includes(name));
      returnIsChild(isDescendant);
    }
    // Return label of selected item
    if (handleReturnName && result) {
      const label = val ? findLabelByValue(result, val) : ''
      handleReturnName(label || '')
    }
  }

  return <TreeSelect
    data={result}
    multi={false}
    placeholder={placeholder}
    value={selectedValue}
    isClearable={isClearable}
    onChange={handleSelect}
    className={className}
    dropdownClassName={dropdownClassName}
    hasError={hasError}
    disabled={disabled}
  />
}

export default SinglSelectStatiya
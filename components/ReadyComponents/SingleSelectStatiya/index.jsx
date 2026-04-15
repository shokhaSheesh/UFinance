import { useEffect, useMemo } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import TreeSelect from '../../shared/Selects/TreeSelect'
import { keepPreviousData } from '@tanstack/react-query'

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
    ?.filter(item => item.nazvanie !== type && !HIDDEN_VALES.has(item?.nazvanie)) // 👈 filter root
    .map(item => mapNode(item, type, hiddenValue))
    .filter(Boolean)
}

const SinglSelectStatiya = ({ selectedValue, setSelectedValue, placeholder = 'Выберите статью', className, type = "Расходы", dropdownClassName, parent, returnIsChild, hiddenValue, hasError, isClearable = true }) => {

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

  useEffect(() => {
    if (selectedValue && returnIsChild) {
      const ancestors = flattenedAncestry[selectedValue] || [];
      const parentArray = Array.isArray(parent) ? parent : [parent];
      // Check if any ancestor matches any of the parent names
      const isDescendant = ancestors.some(name => parentArray.includes(name));
      returnIsChild(isDescendant);
    }
  }, [selectedValue, flattenedAncestry, parent, returnIsChild])

  const handleSelect = (val) => {
    setSelectedValue?.(val);
    if (parent && returnIsChild) {
      const ancestors = flattenedAncestry[val] || [];
      const parentArray = Array.isArray(parent) ? parent : [parent];
      // Check if any ancestor matches any of the parent names
      const isDescendant = ancestors.some(name => parentArray.includes(name));
      returnIsChild(isDescendant);
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
  />
}

export default SinglSelectStatiya
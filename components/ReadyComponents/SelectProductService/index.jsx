import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import { productServiceDto } from '../../../lib/dtos/productServiceDto'
import MultiSelect from '../../shared/Selects/MultiSelect'
import SingleSelect from '../../shared/Selects/SingleSelect'

const SelectProductService = ({
  value,
  onChange,
  placeholder,
  className,
  dropdownClassName,
  multi = false,
  selected,
  sellingDealId,
  dealIdField = 'sales_transactions_id',
  hasError,
  isClearable = false,
  name = '',
  returnFieldValue,
  returnName,
  disabled = false,
  dropdownHeaderItem,
  type,
  selectedLabel,
  // Ограничить список складскими позициями: массив/Set id товаров, которые
  // есть на нужном складе. null/undefined — без ограничения.
  allowedProductIds
}) => {
  const t = useTranslations('Common')
  const [searchQuery, setSearchQuery] = useState('')

  // Debounced search update
  const debouncedSetSearch = useMemo(
    () => debounce((value) => {
      setSearchQuery(value)
    }, 300),
    []
  )

  const { data: productsData, isLoading, isFetching } = useUcodeRequestQuery({
    method: "list_products_and_services",
    data: {
      [dealIdField]: sellingDealId,
      search: searchQuery,
      // Optionally restrict the list to physical goods ("product") or
      // services ("service"); omitted → both are returned.
      ...(type ? { type } : {})
    },
    querySetting: {
      select: (response) => productServiceDto(response?.data?.data) || [],
      // Товар могли добавить в сделку только что: держать список полчаса в кэше
      // нельзя — он открывался бы без новой позиции. Обновляем при монтировании.
      staleTime: 0,
      refetchOnMount: 'always',
      placeholderData: keepPreviousData
    }

  })



  // Create lookup map for raw data by guid
  const rawDataMap = useMemo(() => {
    const map = new Map()
      ; (productsData || []).forEach(item => {
        map.set(item.guid, item)
      })
    return map
  }, [productsData])

  // Артикул показываем в скобках рядом с названием; пустой (или из пробелов)
  // артикул скобок не рисует
  const withArticle = (name, article) => {
    const art = String(article || '').trim()
    return art ? `${name || ''} (${art})` : name
  }

  // Позиция каталога адресуется двумя id (guid строки и product_and_service_id),
  // а какой из них лежит в остатках — зависит от метода, поэтому в фильтр
  // пропускаем позицию по совпадению любого из них
  const allowedIdSet = useMemo(() => {
    if (!allowedProductIds) return null
    const ids = allowedProductIds instanceof Set ? [...allowedProductIds] : allowedProductIds
    return Array.isArray(ids) ? new Set(ids.filter(Boolean)) : null
  }, [allowedProductIds])

  const mappedData = useMemo(() => {
    const source = allowedIdSet
      ? (productsData || []).filter(
        item => allowedIdSet.has(item.product_and_service_id) || allowedIdSet.has(item.guid)
      )
      : productsData || []

    const data = source.map(item => ({
      value: item.guid,
      label: withArticle(item.name, item.article)
    }))

    if (selected) {
      const selectedArray = Array.isArray(selected) ? selected : [selected];
      return data.filter(item => !selectedArray.includes(item.value));
    }

    return data;
  }, [productsData, selected, allowedIdSet])

  // Выбранное значение может отсутствовать в подгруженном списке (напр. при
  // редактировании value = product_and_service_id, а опции по guid). Чтобы товар
  // всё равно отображался — добавляем его отдельной опцией из selectedLabel.
  const optionsWithSelected = useMemo(() => {
    if (multi || !value || Array.isArray(value)) return mappedData
    if (mappedData.some((o) => o.value === value)) return mappedData
    return [{ value, label: selectedLabel || value }, ...mappedData]
  }, [mappedData, value, selectedLabel, multi])

  // Handle selection and return field value
  const handleChange = (val) => {
    // For multi-select, use the last selected value
    const lookupValue = multi && Array.isArray(val) ? val[val.length - 1] : val
    const rawItem = rawDataMap.get(lookupValue)

    // Pass the picked raw item as a 2nd arg so callers can read the real
    // product_and_service_id directly (authoritative) instead of re-resolving
    // the guid against a possibly-incomplete list.
    onChange(val, rawItem)

    if (name && returnFieldValue && rawItem) {
      const fieldValue = rawItem[name] ?? rawItem.summa ?? null
      returnFieldValue(fieldValue)
    }

    // Return the readable product/service name (e.g. tariff name) on selection
    if (returnName) {
      returnName(rawItem?.name ?? '')
    }
  }

  // Handle search input with debounce
  const handleSearch = (value) => {
    debouncedSetSearch(value)
  }


  const Component = multi ? MultiSelect : SingleSelect;

  return (
    <Component
      data={optionsWithSelected}
      value={value}
      onChange={handleChange}
      onSearch={handleSearch}
      isSearching={isFetching}
      placeholder={isFetching || isLoading ? t('loading') : placeholder || t('placeholders.selectProduct')}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
      isClearable={isClearable}
      disabled={disabled}
      dropdownHeaderItem={dropdownHeaderItem}
    />
  )
}

export default SelectProductService;
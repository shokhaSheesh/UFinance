import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { useUcodeDefaultApiQuery, useUcodeRequestQuery } from '../../../hooks/useDashboard'
import { productServiceDto } from '../../../lib/dtos/productServiceDto'
import { formatAmount } from '../../../utils/helpers'
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
  selectedLabel
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



  const { data: groups } = useUcodeDefaultApiQuery({
    queryKey: 'product_services_groups',
    urlMethod: 'GET',
    urlParams: '/items/group_product_and_service?from-ofs=true&data=%7B%22offset%22%3A0%2C%22limit%22%3A1000%7D',
    querySetting: {
      select: data => data?.data?.data?.response
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

  const mappedData = useMemo(() => {
    // Под названием показываем «группа • цена» — как в справочнике товаров и услуг
    const describe = (item) => {
      const group = (groups || []).find(
        g => g?.guid === item?.product_and_service_group_id
      )
      const groupName = group?.name || group?.nazvanie_gruppy || ''
      const price = formatAmount(Number(item?.tsena_za_ed) || 0)
      return groupName ? `${groupName} • ${price}` : price
    }

    const data = (productsData || []).map(item => ({
      value: item.guid,
      label: withArticle(item.name, item.article),
      description: describe(item)
    }))

    if (selected) {
      const selectedArray = Array.isArray(selected) ? selected : [selected];
      return data.filter(item => !selectedArray.includes(item.value));
    }

    return data;
  }, [productsData, selected, groups])

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
      {...(multi
        ? {}
        : {
          customRenderItem: (node, isSelected) => (
            <div className="flex items-center justify-between gap-2 px-4 py-2">
              <div className="flex flex-col min-w-0">
                <span className="text-xss!">{node.label}</span>
                {node.description && (
                  <span className="text-xs text-neutral-400">{node.description}</span>
                )}
              </div>
              {isSelected && <Check size={16} className="text-primary shrink-0" />}
            </div>
          )
        })}
    />
  )
}

export default SelectProductService;
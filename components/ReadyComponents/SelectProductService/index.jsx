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
  hasError,
  isClearable = false,
  name = '',
  returnFieldValue,
  returnName,
  disabled = false,
  dropdownHeaderItem
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
      sales_transaction_id: sellingDealId,
      search: searchQuery
    },
    querySetting: {
      select: (response) => productServiceDto(response?.data?.data) || [],
      staleTime: 1000 * 60 * 30, // 30 minutes
      placeholder: keepPreviousData
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

  const mappedData = useMemo(() => {
    const data = (productsData || []).map(item => ({
      value: item.guid,
      label: item.name
    }))

    if (selected) {
      const selectedArray = Array.isArray(selected) ? selected : [selected];
      return data.filter(item => !selectedArray.includes(item.value));
    }

    return data;
  }, [productsData, selected])

  // Handle selection and return field value
  const handleChange = (val) => {
    onChange(val)

    // For multi-select, use the last selected value
    const lookupValue = multi && Array.isArray(val) ? val[val.length - 1] : val
    const rawItem = rawDataMap.get(lookupValue)

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
      data={mappedData}
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
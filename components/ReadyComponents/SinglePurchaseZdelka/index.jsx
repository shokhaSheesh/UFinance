import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import { sealDeal } from '../../../store/saleDeal.store'
import SingleSelect from '../../shared/Selects/SingleSelect'

const SinglePurchaseZdelka = ({
  value,
  onChange,
  placeholder,
  className,
  dropdownClassName,
  hasError,
  isClearable = true,
  disabled = false,
  dropdownHeaderItem = null
}) => {
  const t = useTranslations('Common')
  const tDeals = useTranslations('Deals')
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const handleSearch = useMemo(() =>
    debounce((val) => setDebouncedSearch(val), 500),
    [])

  useEffect(() => {
    return () => handleSearch.cancel()
  }, [handleSearch])

  const { data: deals, isLoading, isFetching } = useUcodeRequestQuery({
    method: "get_purchase_list",
    data: {
      page: 1,
      limit: 100,
      search: debouncedSearch,
      // get_purchase_list requires these — the main purchases list always sends them too
      accounting_method: sealDeal.dealsMethod === 'accrual_method' ? tDeals('methods.accrual') : tDeals('methods.cash'),
      isCalculation: false,
    },
    querySetting: {
      select: (response) => response?.data?.data || [],
      staleTime: 1000 * 60 * 30,
      placeholderData: keepPreviousData
    }
  })

  // The currently selected deal may not be among the first 100 results (paging/search),
  // so its label wouldn't resolve — fetch it directly by guid to guarantee it always shows.
  const { data: selectedDeal } = useUcodeRequestQuery({
    queryKey: 'get_purchase_transaction_by_guid_for_select',
    method: "get_purchase_transaction_by_guid",
    data: { guid: value },
    skip: !value,
    querySetting: {
      select: (response) => response?.data?.data,
      staleTime: 1000 * 60 * 30,
    }
  })

  const options = useMemo(() => {
    const base = (!deals || !Array.isArray(deals)) ? [] : deals.map(deal => ({
      value: deal.guid,
      label: deal?.name || deal?.Nazvanie || t('noName')
    }))

    if (value && !base.some(o => o.value === value) && selectedDeal) {
      base.push({
        value: selectedDeal.guid || value,
        label: selectedDeal?.name || selectedDeal?.Nazvanie || t('noName')
      })
    }

    return base
  }, [deals, t, value, selectedDeal])

  return (
    <SingleSelect
      data={options}
      value={value}
      onChange={onChange}
      placeholder={isLoading ? t('loading') : placeholder || t('placeholders.selectDeals')}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
      isClearable={isClearable}
      disabled={disabled}
      onSearch={handleSearch}
      isSearching={isFetching}
      dropdownHeaderItem={dropdownHeaderItem}
    />
  )
}

export default SinglePurchaseZdelka

'use client'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { sealDeal } from '@/store/saleDeal.store'
import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import MultiSelect from '../../shared/Selects/MultiSelect'

const MultiSelectPurchaseZdelka = ({
  value = [],
  onChange = () => { },
  placeholder,
  className,
  dropdownClassName,
  hasError,
  dropdownHeaderItem
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
      select: (response) => response?.data?.data,
      staleTime: 1000 * 60 * 30,
      placeholderData: keepPreviousData
    }
  })

  const options = useMemo(() => {
    if (!deals || !Array.isArray(deals)) return []

    return deals.map(deal => ({
      value: deal.guid,
      label: deal?.name || deal?.Nazvanie || t('noName')
    }))
  }, [deals, t])

  return (
    <MultiSelect
      data={options}
      value={Array.isArray(value) ? value : []}
      onChange={onChange}
      placeholder={isLoading ? t('loading') : (placeholder || t('placeholders.selectDeals'))}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
      onSearch={handleSearch}
      isSearching={isFetching}
      dropdownHeaderItem={dropdownHeaderItem}
    />
  )
}

export default MultiSelectPurchaseZdelka

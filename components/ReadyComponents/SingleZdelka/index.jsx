'use client'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { keepPreviousData } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'
import SingleSelect from '../../shared/Selects/SingleSelect'

const SingleZdelka = ({
  value,
  onChange,
  placeholder,
  className,
  dropdownClassName,
  hasError,
  withSearch = true,
  defaultDealGuid,
  dropdownHeaderItem
}) => {
  const t = useTranslations('Common')
  const [search, setSearch] = useState('')
  const [autoSearchSinglbyID, setAutoSearchSinglbyID] = useState(value)


  const filterData = {
    page: 1,
    limit: 100,
    search,
    ids: autoSearchSinglbyID && !search ? [autoSearchSinglbyID] : null
  }

  const { data: deals, isLoading } = useUcodeRequestQuery({
    method: "get_sales_list_simple",
    data: filterData,
    querySetting: {
      select: (response) => response?.data?.data,
      staleTime: 1000 * 60 * 30, // 30 minutes
      placeholder: keepPreviousData
    }
  })

  const debouncedSearch = useMemo(
    () => debounce((value) => setSearch(value), 300),
    []
  )

  const handleSearch = useCallback((value) => {
    setAutoSearchSinglbyID('')
    debouncedSearch(value)
  }, [debouncedSearch])

  const handleChange = useCallback((newValue) => {
    if (!newValue) {
      setAutoSearchSinglbyID('')
    }
    onChange?.(newValue)
  }, [onChange])

  const options = useMemo(() => deals?.map(deal => ({
    value: deal.guid,
    label: deal?.Nazvanie || t('noName')
  })), [deals, t])

  return (
    <SingleSelect
      data={options}
      withSearch={withSearch}
      value={autoSearchSinglbyID || value}
      onChange={handleChange}
      onSearch={handleSearch}
      placeholder={isLoading ? t('loading') : (placeholder || t('placeholders.selectDeal'))}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
      dropdownHeaderItem={dropdownHeaderItem}
    />
  )
}

export default SingleZdelka;
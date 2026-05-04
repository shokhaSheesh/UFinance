'use client'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { keepPreviousData } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import MultiSelect from '../../shared/Selects/MultiSelect'

const MultiSelectZdelka = ({
  value = [],
  onChange = () => { },
  placeholder,
  className,
  dropdownClassName,
  hasError
}) => {
  const t = useTranslations('Common')
  const { data: deals, isLoading } = useUcodeRequestQuery({
    method: "get_sales_list_simple",
    data: { 
      page: 1,
      limit: 100,
    },
    querySetting: {
      select: (response) => response?.data?.data,
      staleTime: 1000 * 60 * 30, // 30 minutes
      placeholder: keepPreviousData
    }
  })

  const options = useMemo(() => {
    if (!deals || !Array.isArray(deals)) return []

    return deals.map(deal => ({
      value: deal.guid,
      label: deal?.Nazvanie || t('noName')
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
    />
  )
}

export default MultiSelectZdelka

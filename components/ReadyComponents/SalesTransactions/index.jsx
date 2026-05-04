import MultiSelect from '@/components/shared/Selects/MultiSelect'
import { useUcodeDefaultApiQuery } from '@/hooks/useDashboard'
import { keepPreviousData } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

const SalesTransactions = ({ value = [], onChange, placeholder, dropdownClassName, hasError }) => {
  const t = useTranslations('Common')
  const { data: dealsData, isLoading } = useUcodeDefaultApiQuery({
    queryKey: 'deals',
    urlMethod: 'GET',
    urlParams: '/items/sales_transactions?from-ofs=true&offset=0&limit=100',
    querySetting: {
      staleTime: 1000 * 60 * 30, // 30 minutes
      placeholder: keepPreviousData
    }
  });

  const formattedDeals = useMemo(() => {
    const items = dealsData?.data?.data?.response || [];
    return items.map(deal => ({
      value: deal.guid,
      label: deal.name || t('noName'),
    }));
  }, [dealsData, t]);

  return (
    <MultiSelect
      data={formattedDeals}
      value={value}
      onChange={onChange}
      placeholder={isLoading ? t('loading') : (placeholder || t('placeholders.selectDeals'))}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
    />
  )
}

export default SalesTransactions;
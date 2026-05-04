import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { useCounterpartiesGroupsPlanFact } from '@/hooks/useDashboard'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import MultiSelect from '../../shared/Selects/MultiSelect'

const SelectCounterPartyGroup = ({ value, onChange, placeholder, className, hasError, isClearable = true, multi = false }) => {
  const t = useTranslations('Common')
  const { data: counterpartiesGroupsData, isLoading } = useCounterpartiesGroupsPlanFact({ page: 1, limit: 100 })

  const counterpartiesGroupsOptions = useMemo(() => {
    const items = counterpartiesGroupsData?.data?.data || []
    if (!items || items.length === 0) return []
    return items.map(item => ({
      value: item.guid,
      label: item.nazvanie_gruppy || t('noName')
    }))
  }, [counterpartiesGroupsData, t])

  const actualPlaceholder = isLoading ? t('loading') : (placeholder || t('placeholders.selectCounterpartyGroup'))
  const Component = multi ? MultiSelect : SingleSelect;
  return (
    <Component
      data={counterpartiesGroupsOptions}
      value={value}
      onChange={onChange}
      placeholder={actualPlaceholder}
      className={className}
      hasError={hasError}
      isClearable={isClearable}
    />
  )
}

export default SelectCounterPartyGroup

import MultiSelect from '@/components/shared/Selects/MultiSelect'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { keepPreviousData } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

const SelectAccountGroups = ({ value, onChange, placeholder, className, dropdownClassName, multi = false, hasError }) => {
  const t = useTranslations('Common')

  const { data: groupsData, isLoading } = useUcodeRequestQuery({
    method: "get_account_groups",
    data: {
      page: 1,
      limit: 100,
    },
    querySetting: {
      select: (response) => response?.data?.data || [],
      staleTime: 1000 * 60 * 30, // 30 minutes
      placeholder: keepPreviousData
    }
  })

  const mappedData = useMemo(() => {
    return (groupsData || []).map(item => ({
      value: item.guid,
      label: item.name || item.nazvanie || t('noName')
    }))
  }, [groupsData, t])

  if (isLoading) {
    return <div className="text-xs text-neutral-400 flex items-center h-10 px-3 border border-neutral-200 rounded-md bg-neutral-50 animate-pulse">{t('loading')}</div>
  }

  const Component = multi ? MultiSelect : SingleSelect;

  return (
    <Component
      data={mappedData}
      value={value}
      onChange={onChange}
      placeholder={placeholder || t('placeholders.selectGroup')}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
    />
  )
}


export default SelectAccountGroups
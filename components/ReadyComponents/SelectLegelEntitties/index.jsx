import { keepPreviousData } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import MultiSelect from '../../shared/Selects/MultiSelect'
import SingleSelect from '../../shared/Selects/SingleSelect'

const SelectLegelEntitties = ({ value, onChange, placeholder, className, childFieldName, returnFieldValue, dropdownClassName, multi = false, hasError, isClearable = true, disabled = false }) => {
  const t = useTranslations('Common')

  const { data: legalEntitiesData, isLoading } = useUcodeRequestQuery({
    method: "get_legal_entities",
    querySetting: {
      select: (response) => response?.data?.data || [],
      staleTime: 1000 * 60 * 30, // 30 minutes
      placeholder: keepPreviousData
    }
  })

  const mappedData = useMemo(() => {
    return (legalEntitiesData || []).map(item => ({
      value: item.guid,
      label: item.nazvanie || t('noName')
    }))
  }, [legalEntitiesData, t])


  if (isLoading) {
    return <div className="text-xs text-neutral-400 flex items-center h-10 px-3 border border-neutral-200 rounded-md bg-neutral-50">{t('loading')}</div>
  }

  const Component = multi ? MultiSelect : SingleSelect;

  return (
    <Component
      data={mappedData}
      value={value}
      onChange={onChange}
      placeholder={placeholder || t('placeholders.selectLegalEntity')}
      className={className}
      dropdownClassName={dropdownClassName}
      hasError={hasError}
      isClearable={isClearable}
      disabled={disabled}
    />
  )
}

export default SelectLegelEntitties;
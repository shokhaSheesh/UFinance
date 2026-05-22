import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { keepPreviousData } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo } from 'react'
import { appStore } from '../../../store/app.store'
import SingleSelect from '../../shared/Selects/SingleSelect'

const MyAccountCurrensies = observer(({ value, onChange, guid, withSearch = false, className, dropDownClassName, placeholder, wrapperClassName, isClearable = true }) => {
  const t = useTranslations('Common')

  const { data: bankAccountsData } = useUcodeRequestQuery({
    method: "get_my_accounts",
    data: {
      group: 'legal_entities'
    },
    querySetting: {
      select: (response) => response?.data?.data,
      placeholder: keepPreviousData
    }
  })


  const options = useMemo(() => {
    const currencies = new Map()

    bankAccountsData
      ?.filter(item => item.legal_entity_id === guid)
      .forEach(item => {
        if (!currencies.has(item.currenies_id)) {
          currencies.set(item.currenies_id, {
            value: item.currenies_id,
            label: item.currenies_kod,
          })
        }
      })

    return [...currencies.values()]
  }, [bankAccountsData, guid])


  const selectOptions = options || appStore.companyCurrencies


  useEffect(() => {
    if (selectOptions?.length === 1 && value !== selectOptions[0].value) {
      onChange(selectOptions[0].value)
    } else if (selectOptions?.length === 0 && value !== '') {
      onChange('')
    }
  }, [selectOptions, onChange, value])

  if (!guid || selectOptions?.length < 2) return null


  return (
    <SingleSelect
      data={selectOptions}
      value={value}
      withSearch={withSearch}
      onChange={onChange}
      isClearable={isClearable}
      className={className}

      dropDownClassName={dropDownClassName}
      placeholder={placeholder || t('placeholders.selectCurrency')}
      wrapperClassName={wrapperClassName}
    />
  )
})

export default MyAccountCurrensies
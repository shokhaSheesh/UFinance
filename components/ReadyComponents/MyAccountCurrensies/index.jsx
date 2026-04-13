import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { appStore } from '../../../store/app.store'
import SingleSelect from '../../shared/Selects/SingleSelect'

const MyAccountCurrensies = observer(({ value, onChange, guid, withSearch = false, className, dropDownClassName, placeholder = 'Выберите валюту', wrapperClassName, isClearable = true }) => {


  const selectOptions = appStore.companyCurrencies


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
      placeholder={placeholder}
      wrapperClassName={wrapperClassName}
    />
  )
})

export default MyAccountCurrensies
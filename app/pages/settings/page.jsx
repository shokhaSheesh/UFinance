'use client'

import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import OperationCheckbox from '../../../components/shared/Checkbox/operationCheckbox'
import SingleSelect from '../../../components/shared/Selects/SingleSelect'
import { useUcodeRequestMutation } from '../../../hooks/useDashboard'
import { queryClient } from '../../../lib/queryClient'
import { appStore } from '../../../store/app.store'

const SettingsPage = observer(() => { 

  const { mutateAsync: updateSettings } = useUcodeRequestMutation()

  const currenciesList = useMemo(() => {
    return appStore.currencies?.map(c => ({
      value: c.guid,
      label: `${c.kod} (${c.nazvanie})`,
    }))
  }, [appStore])

  function handleSwitchPayment() {
    appStore.setIsPayment(!appStore.isPayment)
  }

  const handleSelectCurrency = async (value) => {
    const name = appStore.currencies.find(c => c.guid === value)?.kod
    await updateSettings({
      method: 'update_general_settings',
      data: {
        default_currency_id: value,
        default_currency_code: name,
      },
    }).then(() => {
      const response = appStore.currencies.find(c => c.guid === value)
      appStore.setCurrency({ name: response?.icon, guid: response?.guid, code: response?.code })
      queryClient.invalidateQueries({ queryKey: ['get_general_settings'] })
      queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })
      queryClient.invalidateQueries({ queryKey: ['find_operations'] })
      queryClient.invalidateQueries({ queryKey: ['list_sales_operations'] })
      queryClient.invalidateQueries({ queryKey: ['list_products_and_services'] })
      queryClient.invalidateQueries({ queryKey: ['get_counterparties'] })
      queryClient.invalidateQueries({ queryKey: ['get_counterparties_groups'] })
      queryClient.invalidateQueries({ queryKey: ['cash_flow'] })
      queryClient.invalidateQueries({ queryKey: ['profit_and_loss'] })
      queryClient.invalidateQueries({ queryKey: ['get_sales_list_simple'] })
      queryClient.invalidateQueries({ queryKey: ['get_legal_entities'] })
      queryClient.invalidateQueries({ queryKey: ['balance_report'] })
    })
  }

  return (
    <div className="p-3">
      <h1 className="text-xl font-bold text-slate-900 mb-7">Общие настройки</h1>

      {/* Account settings */}
      <section className="flex flex-col gap-1.5 mb-7 pb-6 border-b border-gray-200 items-start">
        <h2 className="text-[15px] font-bold text-slate-900 mb-3.5">Настройки аккаунта</h2>
        <div className="mb-2">
          <label className="block text-sm font-medium text-slate-500 mb-1.5">Основная валюта</label>
          <div className="relative w-[280px]">
            <SingleSelect
              data={currenciesList}
              value={appStore?.currency?.guid}
              onChange={handleSelectCurrency}
              placeholder="Выберите валюту"
              isClearable={false}
              className="bg-white text-neutral-700"
            />
          </div>
        </div>
      </section>

      {/* Accounting settings */}
      <section className="flex flex-col gap-1.5 mb-7 pb-6 border-b border-gray-200 items-start">
        <h2 className="text-[15px] font-bold text-slate-900 mb-3.5">Настройки учета</h2>
        <section className="flex flex-col gap-1.5 items-start">
          <h2 className="text-[15px] font-bold text-slate-900 mb-3.5">
            Создание и редактирование операций
          </h2>
          <OperationCheckbox
            checked={appStore.isPayment}
            onChange={handleSwitchPayment}
            label="Тип платежа"
          /> 
        </section>
      </section>
    </div>
  )
})

export default SettingsPage

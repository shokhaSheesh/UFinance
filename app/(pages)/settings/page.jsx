'use client'

import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { useUcodeRequestMutation } from '@/hooks/useDashboard'
import { queryClient } from '@/lib/queryClient'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

const CURRENCY_DEPENDENT_QUERY_KEYS = [
  'get_general_settings',
  'get_my_accounts',
  'find_operations',
  'list_sales_operations',
  'list_products_and_services',
  'get_counterparties',
  'get_counterparties_groups',
  'cash_flow',
  'profit_and_loss',
  'get_sales_list_simple',
  'get_legal_entities',
  'balance_report',
]

const SettingsPage = observer(() => {
  const tg = useTranslations('Settings.general')
  const tc = useTranslations('Settings.common')
  const { mutateAsync: updateSettings, isPending: isSaving } = useUcodeRequestMutation()
  // const { mutateAsync: createWlcmToken, isPending: isSavingToken } = useMutation({
  //   mutationKey: ['set_wlcm_token'],
  //   mutationFn: (data) => apiClient.invokeFunction({ ...data, type: 'role' }),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['get_general_settings'] })
  //   }
  // })

  const [isPayment, setIsPayment] = useState(appStore.isPayment)
  const [isAccrualDate, setIsAccrualDate] = useState(appStore.isAccrualDate)
  const [warehouseActive, setWarehouseActive] = useState(appStore.warehouseActive)
  const [returnActive, setReturnActive] = useState(appStore.returnActive)
  const [projectActive, setProjectActive] = useState(appStore.projectActive)
  const [currencyId, setCurrencyId] = useState(appStore?.currency?.guid)
  // const [wlcmHashcode, setWlcmHashcode] = useState('')

  // appStore is still hydrating from `get_general_settings` (via AppProvider)
  // when this page first mounts, so the useState() initial values above can
  // capture stale defaults. Re-sync local state once the real values land.
  useEffect(() => {
    setIsPayment(appStore.isPayment)
    setIsAccrualDate(appStore.isAccrualDate)
    setWarehouseActive(appStore.warehouseActive)
    setReturnActive(appStore.returnActive)
    setProjectActive(appStore.projectActive)
    setCurrencyId(appStore?.currency?.guid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appStore.isPayment, appStore.isAccrualDate, appStore.warehouseActive, appStore.returnActive, appStore.projectActive, appStore?.currency?.guid])

  const currenciesList = appStore.currencies?.map(c => ({
    value: c.guid,
    label: `${c?.kod} (${c.nazvanie})`,
  }))

  // Возвраты работают только вместе со складом — выключаем их вместе с ним
  const handleWarehouseToggle = value => {
    setWarehouseActive(value)
    if (!value) setReturnActive(false)
  }

  const isPaymentChanged = isPayment !== appStore.isPayment
  const isAccrualDateChanged = isAccrualDate !== appStore.isAccrualDate
  const isWarehouseActiveChanged = warehouseActive !== appStore.warehouseActive
  const isReturnActiveChanged = returnActive !== appStore.returnActive
  const isProjectActiveChanged = projectActive !== appStore.projectActive
  const isCurrencyChanged = currencyId !== appStore?.currency?.guid
  const hasChanges = isPaymentChanged || isAccrualDateChanged || isWarehouseActiveChanged || isReturnActiveChanged || isProjectActiveChanged || isCurrencyChanged


  const handleSaveSettings = async () => {
    const data = {}

    if (isPaymentChanged) data.is_payment = isPayment
    if (isAccrualDateChanged) data.is_accural_date = isAccrualDate
    if (isWarehouseActiveChanged) data.warehouse_active = warehouseActive
    if (isReturnActiveChanged) data.return_active = returnActive
    if (isProjectActiveChanged) data.project_active = projectActive
    // if (wlcmHashcode) {
    //   try {
    //     await createWlcmToken({
    //       method: "wlcm_onboarding_payment_create",
    //       data: {
    //         token: wlcmHashcode
    //       }
    //     })
    //     queryClient.invalidateQueries({ queryKey: ['get_general_settings'] })
    //   } catch (error) {
    //     console.log('Error', error?.message)
    //   }
    //   return
    // }
    if (isCurrencyChanged) {
      const selected = appStore.currencies.find(c => c.guid === currencyId)
      data.default_currency_id = currencyId
      data.default_currency_code = selected?.kod
    }

    try {
      await updateSettings({
        method: 'update_general_settings',
        data,
      })

      if (isPaymentChanged) appStore.setIsPayment(isPayment)
      if (isAccrualDateChanged) {
        appStore.setIsAccrualDate(isAccrualDate)
        if (isAccrualDate) {
          appStore.setAccuralDateBranch(authStore?.branch_id)
        }
      }
      if (isWarehouseActiveChanged) appStore.setWarehouseActive(warehouseActive)
      if (isReturnActiveChanged) appStore.setReturnActive(returnActive)
      if (isProjectActiveChanged) appStore.setProjectActive(projectActive)
      if (isCurrencyChanged) {
        const selected = appStore.currencies.find(c => c.guid === currencyId)
        appStore.setCurrency({
          name: selected?.icon,
          guid: selected?.guid,
          code: selected?.code,
        })
        CURRENCY_DEPENDENT_QUERY_KEYS.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] })
        })
      } else {
        queryClient.invalidateQueries({ queryKey: ['get_general_settings'] })
      }

      showSuccessNotification(tg('success'))
    } catch (error) {
      console.error('Error saving settings:', error)
      showErrorNotification(tg('error'))
    }
  }



  const isSavingData = isSaving

  return (
    <div className=" bg-white w-full">
      <h1 className="text-xl sticky top-0 bg-white p-3 font-bold text-slate-900 mb-7">{tg('pageTitle')}</h1>

      {/* Account settings */}
      <section className="flex p-3 flex-col gap-1.5 mb-7 pb-6 border-b border-gray-200 items-start">
        <h2 className="text-[15px] font-bold text-slate-900 mb-3.5">{tg('account.title')}</h2>
        <div className="mb-2">
          <label className="block text-sm font-medium text-slate-500 mb-1.5">{tg('account.currency')}</label>
          <div className="relative w-[280px]">
            <SingleSelect
              data={currenciesList}
              value={currencyId}
              onChange={setCurrencyId}
              placeholder={tg('account.placeholder')}
              isClearable={false}
              className="bg-white text-neutral-700"
            />
          </div>
        </div>
      </section>

      {/* Accounting settings */}
      <section className="flex p-3 flex-col gap-1.5 mb-7 pb-6 border-b border-gray-200 items-start">
        <section className="flex flex-col gap-1.5 items-start">
          <h2 className="text-[15px] font-bold text-slate-900 mb-3.5">
            {tg('accounting.operations')}
          </h2>
          <OperationCheckbox
            checked={isPayment}
            onChange={() => setIsPayment(!isPayment)}
            label={tg('accounting.paymentType')}
          />
          <OperationCheckbox
            checked={isAccrualDate}
            onChange={() => setIsAccrualDate(!isAccrualDate)}
            label={tg('accounting.accrualDate')}
          />
        </section>
      </section>

      {/* Modules */}
      <section className="flex p-3 flex-col gap-1.5 mb-7 pb-6 border-b border-gray-200 items-start">
        <section className="flex flex-col gap-1.5 items-start">
          <h2 className="text-[15px] font-bold text-slate-900 mb-3.5">
            {tg('modules.title')}
          </h2>
          <OperationCheckbox
            checked={warehouseActive}
            onChange={() => handleWarehouseToggle(!warehouseActive)}
            label={tg('modules.warehouse')}
          />
          <OperationCheckbox
            checked={returnActive}
            onChange={() => setReturnActive(!returnActive)}
            label={tg('modules.returns')}
            disabled={!warehouseActive}
            className={!warehouseActive ? 'opacity-50 pointer-events-none' : ''}
          />
          <OperationCheckbox
            checked={projectActive}
            onChange={() => setProjectActive(!projectActive)}
            label={tg('modules.projects')}
          />
        </section>
      </section>
      {/* <section className="flex p-3 flex-col gap-1.5 mb-7 pb-6 border-b border-gray-200 items-start">
        <section className="flex flex-col gap-1.5 items-start">
          <h2 className="text-[15px] font-bold text-slate-900 mb-3.5">
            {tg('accounting.wlcm_title')}
          </h2>
          <Input
            value={wlcmHashcode}
            onChange={(event) => setWlcmHashcode(event?.target?.value)}
            placeholder={tg('accounting.wlcm')}
          />
        </section>
      </section> */}

      <div className="sticky bottom-0 bg-white  p-3 flex justify-start">
        <button
          onClick={handleSaveSettings}
          disabled={!hasChanges || isSavingData}
          className="px-4 py-2 bg-blue-600 cursor-pointer text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSavingData && <Loader2 size={16} className="animate-spin" />}
          {isSavingData ? tc('saving') : tc('save')}
        </button>
      </div>
    </div>
  )
})

export default SettingsPage

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useUcodeRequestMutation } from '@/hooks/useDashboard'
import { queryClient } from '@/lib/queryClient'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { CURRENCY_DEPENDENT_QUERY_KEYS } from '@/modules/settings/general/utils/settingsConstants'

export const useGeneralSettings = () => {
  const tg = useTranslations('Settings.general')
  const { mutateAsync: updateSettings, isPending: isSaving } = useUcodeRequestMutation()

  const [isPayment, setIsPayment] = useState(appStore?.isPayment)
  const [isAccrualDate, setIsAccrualDate] = useState(appStore?.isAccrualDate)
  const [currencyId, setCurrencyId] = useState(appStore?.currency?.guid)

  const currenciesList = appStore?.currencies?.map(c => ({
    value: c?.guid,
    label: `${c?.kod} (${c?.nazvanie})`,
  }))

  const isPaymentChanged = isPayment !== appStore?.isPayment
  const isAccrualDateChanged = isAccrualDate !== appStore?.isAccrualDate
  const isCurrencyChanged = currencyId !== appStore?.currency?.guid
  const hasChanges = isPaymentChanged || isAccrualDateChanged || isCurrencyChanged

  const handleSaveSettings = async () => {
    const data = {}

    if (isPaymentChanged) data.is_payment = isPayment
    if (isAccrualDateChanged) data.is_accural_date = isAccrualDate
    if (isCurrencyChanged) {
      const selected = appStore?.currencies?.find(c => c?.guid === currencyId)
      data.default_currency_id = currencyId
      data.default_currency_code = selected?.kod
    }

    try {
      await updateSettings({
        method: 'update_general_settings',
        data,
      })

      if (isPaymentChanged) appStore?.setIsPayment(isPayment)
      if (isAccrualDateChanged) {
        appStore?.setIsAccrualDate(isAccrualDate)
        if (isAccrualDate) {
          appStore?.setAccuralDateBranch(authStore?.branch_id)
        }
      }
      if (isCurrencyChanged) {
        const selected = appStore?.currencies?.find(c => c?.guid === currencyId)
        appStore?.setCurrency({
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

  return {
    isPayment,
    setIsPayment,
    isAccrualDate,
    setIsAccrualDate,
    currencyId,
    setCurrencyId,
    currenciesList,
    hasChanges,
    isSaving,
    handleSaveSettings,
  }
}

'use client'

import { useEffect } from "react"
import { useUcodeRequestQuery } from "../hooks/useDashboard"
import { appStore } from "../store/app.store"

import { TooltipProvider } from "@/components/ui/tooltip"
import { initAnalytics } from "@/lib/firebase"
import { authStore } from "../store/auth.store"

const AppProvider = ({ children }) => {
  const { data } = useUcodeRequestQuery({
    method: 'get_general_settings',
    querySetting: {
      select: (response) => response?.data?.data,
    },
    skip: !authStore.isAuthenticated,
    retry: 3
  })
  const { data: currencies } = useUcodeRequestQuery({
    method: 'get_currencies',
    querySetting: {
      select: (response) => response?.data?.data,
    },
    skip: !authStore.isAuthenticated
  })

  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    if (currencies) {
      appStore.setCurrencies(currencies)
      const currency = currencies.find(c => data?.default_currency_id ? c.guid === data?.default_currency_id : c?.kod === 'UZS')
      appStore.setIsAccrualDate(data?.is_accural_date)
      appStore.setIsPayment(data?.is_payment)
      appStore.setWLCMPayment(data?.wlcm_active)
      if (currency) {
        appStore.setCurrency({ name: currency.icon, guid: currency.guid, code: currency?.kod })
      }
    }
  }, [currencies, data])


  return (
    <TooltipProvider delay={0}>
      <div>{children}</div>
    </TooltipProvider>
  )
}

export default AppProvider
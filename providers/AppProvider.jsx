'use client'

import { TooltipProvider } from "@/components/ui/tooltip"
import { initAnalytics } from "@/lib/firebase"
import { observer } from "mobx-react-lite"
import { useEffect } from "react"
import { useUcodeRequestQuery } from "../hooks/useDashboard"
import { appStore } from "../store/app.store"
import { authStore } from "../store/auth.store"

// observer: AppProvider монтируется в корневом layout и живёт при клиентском
// переходе с /auth после логина. Без observer смена authStore.isAuthenticated не
// вызывает ре-рендер, и запросы с `skip: !isAuthenticated` (get_general_settings,
// get_currencies) не стартуют, пока не перезагрузишь страницу.
const AppProvider = observer(({ children }) => {
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
      appStore.setWarehouseActive(data?.warehouse_active)
      appStore.setReturnActive(data?.return_active)
      appStore.setProjectActive(data?.project_active)
      appStore.setAiActive(Boolean(data?.ia_active ?? data?.ai_active))
      appStore.setPlanTotalActive(Boolean(data?.plan_total_active))
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
})

export default AppProvider
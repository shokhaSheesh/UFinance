'use client'

import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { appStore } from '@/store/app.store'
import { toJS } from 'mobx'
import { useMemo } from 'react'

/**
 * Валюты, которые реально используются счетами текущего филиала.
 *
 * `get_my_currencies` возвращает distinct-список по «Моим счетам»
 * (`[{ guid, kod, nazvanie }]`) без курсов и без входных параметров — филиал
 * бэкенд берёт из контекста. В отличие от `get_currencies`, который отдаёт
 * вообще все валюты системы, поэтому для селекторов валюты отчётов подходит
 * именно этот метод.
 *
 * Значение опции — код валюты (`UZS`), потому что отчёты (`cash_flow`,
 * `profit_and_loss`) ждут в `currencyCode` именно код, а не guid.
 *
 * Пока метод не ответил (или у филиала нет счетов) отдаём прежний источник —
 * `appStore.myCurrencies`, собранный из `get_my_accounts`, чтобы селектор не
 * оказался пустым.
 */
export const useMyCurrencies = () => {
  const { data, isLoading, isError } = useUcodeRequestQuery({
    method: 'get_my_currencies',
    querySetting: {
      select: (response) => response?.data?.data || [],
      staleTime: 5 * 60 * 1000,
    },
  })

  const options = useMemo(() => {
    const list = (data || []).filter((item) => item?.kod)
    if (!list.length) return toJS(appStore.myCurrencies) || []
    return list.map((item) => ({
      value: item.kod,
      label: item.kod,
      guid: item.guid,
      title: item.nazvanie,
    }))
  }, [data])

  return { currencies: data || [], options, isLoading, isError }
}

export default useMyCurrencies

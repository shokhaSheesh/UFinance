'use client'

import { GlobalCurrency } from '@/constants/globalCurrency'
import { apiClient } from '@/lib/api/ucode/base'
import { indicators } from '@/store/indicatos.store'
import { useQuery } from '@tanstack/react-query'
import moment from 'moment'
import { enqueueIndicatorRequest } from '../utils/requestQueue'

/**
 * Запросы, общие для нескольких блоков «Показателей».
 *
 * Параметры собраны ровно так же, как в блоках «Прибыль», «Денежный поток» и
 * «Остатки на счетах» — ключи запросов совпадают, поэтому новые блоки
 * («Рентабельность», «Запас денег») берут те же ответы из кэша, а не шлют
 * повторные тяжёлые запросы. При изменении параметров там — меняйте и здесь.
 */

const day = (value) => (value ? moment(value).format('YYYY-MM-DD') : null)

/** profit_and_loss — как в Profit (queryKey 'profit_indicators'). */
export function useIndicatorProfit() {
  const store = indicators
  const filterData = {
    periodStartDate: moment(store.rangeMonth.start).format('YYYY-MM-DD'),
    periodEndDate: moment(store.rangeMonth.end).format('YYYY-MM-DD'),
    periodType: store.periodType,
    userCurrencyCode: GlobalCurrency?.code,
    accounting_method: store.profitableclientsMethod,
    currencyCode: indicators?.currencyCode,
    accountId: store.accounts,
    sellingDealId: store?.deals,
    project_ids: store?.projects,
    isEbitda: false,
    isEbit: false,
    isEbt: false,
    limit: 100,
    page: 1,
  }
  return useQuery({
    queryKey: ['profit_indicators', filterData],
    queryFn: () => enqueueIndicatorRequest(() => apiClient.invokeFunction({ method: 'profit_and_loss', data: filterData })),
    select: (res) => res?.data?.data,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })
}

/** cash_flow — как в CashFlow (queryKey 'cash_flow'). */
export function useIndicatorCashFlow() {
  const { rangeMonth, periodType, deals, accounts } = indicators
  const filterData = {
    periodStartDate: day(rangeMonth?.start),
    periodEndDate: day(rangeMonth?.end),
    periodType: periodType,
    currencyCode: GlobalCurrency?.code,
    sellingDealId: deals,
    project_ids: indicators.projects,
    accountId: accounts,
  }
  return useQuery({
    queryKey: ['cash_flow', filterData],
    queryFn: () => enqueueIndicatorRequest(() => apiClient.invokeFunction({ method: 'cash_flow', data: filterData })),
    select: (res) => res?.data?.data,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })
}

/** get_my_accounts_daily_balances — как в AccountBalance. */
export function useIndicatorBalances() {
  const { rangeMonth, accounts } = indicators
  const filterData = {
    from_date: day(rangeMonth?.start),
    to_date: day(rangeMonth?.end),
    accountId: accounts,
    currencyCode: indicators?.currencyCode,
  }
  return useQuery({
    queryKey: ['get_my_accounts_daily_balances', filterData],
    queryFn: () => enqueueIndicatorRequest(() => apiClient.invokeFunction({ method: 'get_my_accounts_daily_balances', data: filterData })),
    select: (res) => res?.data?.data?.items,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })
}

/** Строка отчёта по id (revenue, expenses, net-profit …). */
export const findRow = (rows, id) => (rows || []).find((row) => row?.id === id)

/** Потоки ДДС, из которых берутся поступления и выплаты (как вкладка «Общий» в CashFlow). */
export const CASH_FLOW_STREAMS = ['Операционный поток', 'Инвестиционный поток', 'Финансовый поток']

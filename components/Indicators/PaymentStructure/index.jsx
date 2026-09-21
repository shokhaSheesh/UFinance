'use client'
import Segmented from '@/components/shared/Segmented/Segmented'
import { useQuery } from "@tanstack/react-query"
import { observer } from "mobx-react-lite"
import moment from "moment"
import { useTranslations } from "next-intl"
import { GlobalCurrency } from "../../../constants/globalCurrency"
import { apiClient } from "../../../lib/api/ucode/base"
import { indicators } from '../../../store/indicatos.store'
import Expenses from '../Expenses'
import Income from '../Income'
import { STATIC_CASHFLOW_DATA, STATIC_PROFIT_DATA } from "../constants/staticChartData"
import { enqueueIndicatorRequest } from '../utils/requestQueue'

const PaymentStructure = observer(() => {
  const t = useTranslations('Indicators')
  const { paymentStructureMethod, setState } = indicators

  const filterData = {
    periodStartDate: moment(indicators.rangeMonth.start).format('YYYY-MM-DD'),
    periodEndDate: moment(indicators.rangeMonth.end).format('YYYY-MM-DD'),
    periodType: indicators.periodType,
    userCurrencyCode: GlobalCurrency?.code,
    accounting_method: indicators.accounting,
    currencyCode: indicators?.currencyCode,
    sellingDealId: indicators?.deals,
    accountId:indicators.accounts,
    project_ids: indicators?.projects,
    isEbitda: false,
    isEbit: false,
    isEbt: false,
    limit: 100,
    page: 1,
  }

  const { data: apiProfitData, isLoading: profitAndLossLoading, isPending: profitPending, isFetching: profitFetching } = useQuery({
    queryKey: ['profit_and_loss_income', filterData],
    queryFn: () => enqueueIndicatorRequest(() => apiClient.invokeFunction({ method: 'profit_and_loss', data: filterData })),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  // Fallback to static data if API returns no data
  const profitAndLossDataList = apiProfitData || STATIC_PROFIT_DATA


  const cashFlowfilterData = {
    periodStartDate: moment(indicators.rangeMonth.start).format('YYYY-MM-DD'),
    periodEndDate: moment(indicators.rangeMonth.end).format('YYYY-MM-DD'),
    periodType: indicators.periodType,
    currencyCode: GlobalCurrency?.code,
    sellingDealId: indicators.deals,
    accountId: indicators.accounts,
    project_ids: indicators.projects,
  }

  const { data: apiCashFlowData, isLoading: isLoadingCashFlow, isPending: cashflowPending, isFetching: cashflowFetching } = useQuery({
    queryKey: ["cash_flow", cashFlowfilterData],
    queryFn: () => enqueueIndicatorRequest(() => apiClient.invokeFunction({ method: "cash_flow", data: cashFlowfilterData })),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  // Fallback to static data if API returns no data
  const cashFlowDataList = apiCashFlowData || STATIC_CASHFLOW_DATA
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">{t('paymentStructure.title')}</h2>
        <Segmented
          ariaLabel={t('paymentStructure.title')}
          value={paymentStructureMethod}
          onChange={(value) => setState('paymentStructureMethod', value)}
          options={[
            { value: 'income_expenses', label: t('paymentStructure.incomeExpenses') },
            { value: 'receipts_payments', label: t('paymentStructure.receiptsPayments') },
          ]}
        />
      </div>
      <Income method={paymentStructureMethod} profitAndLossDataList={profitAndLossDataList} cashFlowDataList={cashFlowDataList} isLoading={profitAndLossLoading || profitPending ||
        profitFetching} />
      <Expenses method={paymentStructureMethod} profitAndLossDataList={profitAndLossDataList} cashFlowDataList={cashFlowDataList} isLoading={isLoadingCashFlow || cashflowPending ||
        cashflowFetching} />
    </div>
  )
})

export default PaymentStructure
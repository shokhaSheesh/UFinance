'use client'
import { useQuery } from "@tanstack/react-query"
import { observer } from "mobx-react-lite"
import moment from "moment"
import { GlobalCurrency } from "../../../constants/globalCurrency"
import { apiClient } from "../../../lib/api/ucode/base"
import { indicators } from "../../../store/indicatos.store"
import Expenses from "../Expenses"
import Income from "../Income"

const PaymentStructure = observer(() => {
  const { paymentStructureMethod, setState } = indicators

  const filterData = {
    periodStartDate: moment(indicators.rangeMonth.start).format('YYYY-MM-DD'),
    periodEndDate: moment(indicators.rangeMonth.end).format('YYYY-MM-DD'),
    periodType: indicators.periodType,
    userCurrencyCode: GlobalCurrency.code,
    accounting_method: indicators.accounting,
    currencyCode: indicators?.currencyCode,
    sellingDealId: indicators?.deals,
    accountId:indicators.accounts,
    isEbitda: false,
    isEbit: false,
    isEbt: false,
    limit: 100,
    page: 1,
  }

  const { data: profitAndLossDataList, isLoading: profitAndLossLoading, isPending: profitPending, isFetching: profitFetching } = useQuery({
    queryKey: ['profit_and_loss_income', filterData],
    queryFn: () => apiClient.invokeFunction({ method: 'profit_and_loss', data: filterData }),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })


  const cashFlowfilterData = {
    periodStartDate: moment(indicators.rangeMonth.start).format('YYYY-MM-DD'),
    periodEndDate: moment(indicators.rangeMonth.end).format('YYYY-MM-DD'),
    periodType: indicators.periodType,
    currencyCode: GlobalCurrency.code,
    sellingDealId: indicators.deals,
    accountId: indicators.accounts,
  }

  const { data: cashFlowDataList, isLoading: isLoadingCashFlow, isPending: cashflowPending, isFetching: cashflowFetching } = useQuery({
    queryKey: ["cash_flow", cashFlowfilterData],
    queryFn: () => apiClient.invokeFunction({ method: "cash_flow", data: cashFlowfilterData }),
    select: (res) => res?.data?.data,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  console.log('cashFlowDataList', cashFlowDataList)
  console.log('profitAndLossDataList', profitAndLossDataList)
  return (
    <div className="w-full">
      <div className="flex items-center gap-10">
        <h4 className="text-lg font-semibold">Структура платежей</h4>
        <div className="items-center rounded-md">
          <button type="button" onClick={() => setState('paymentStructureMethod', 'income_expenses')} id="income_expenses" className={`text-neutral-700 border rounded-l-md cursor-pointer text-sm p-2  w-52 ${paymentStructureMethod === 'income_expenses' ? 'border-primary rounded-l-md ' : ''}`}>Доходы и расходы</button>
          <button type="button" onClick={() => setState('paymentStructureMethod', 'receipts_payments')} id="receipts_payments" className={`text-neutral-700 border rounded-r-md cursor-pointer text-sm p-2  w-52 ${paymentStructureMethod === 'receipts_payments' ? 'border-primary rounded-r-md ' : ''}`}>Поступления и выплаты</button>
        </div>
      </div>
      <Income method={paymentStructureMethod} profitAndLossDataList={profitAndLossDataList} cashFlowDataList={cashFlowDataList} isLoading={profitAndLossLoading || profitPending ||
        profitFetching} />
      <Expenses method={paymentStructureMethod} profitAndLossDataList={profitAndLossDataList} cashFlowDataList={cashFlowDataList} isLoading={isLoadingCashFlow || cashflowPending ||
        cashflowFetching} />
    </div>
  )
})

export default PaymentStructure
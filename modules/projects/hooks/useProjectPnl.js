import { GlobalCurrency } from "@/constants/globalCurrency";
import { apiClient } from "@/lib/api/ucode/base";
import { appStore } from "@/store/app.store";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import { useMemo } from "react";

// Идентификация корневых строк отчёта (name/id/type = income/expenses)
const isIncomeRow = (r) =>
  r?.name === "income" || r?.id === "income" || r?.type === "income";
const isExpenseRow = (r) =>
  r?.name === "expenses" || r?.id === "expenses" || r?.type === "expenses";

const sumValues = (row) =>
  Object.values(row?.values || {}).reduce((s, v) => s + (Number(v) || 0), 0);

/**
 * P&L (profit_and_loss) для дашборда проекта.
 * Доходы/Расходы берём из отчёта (фильтр по проекту), Прибыль и Рентабельность
 * считаем из итогов. Данные — помесячно (periodType: monthly).
 *
 * @param {string} projectGuid
 * @param {{ isCalculation: 'accrual'|'cash', dateRange: {start,end}, currencyCode?: string }} opts
 */
export function useProjectPnl(
  projectGuid,
  { isCalculation = "accrual", dateRange, currencyCode } = {}
) {
  const start = dateRange?.start
    ? moment(dateRange.start).format("YYYY-MM-DD")
    : moment().startOf("year").format("YYYY-MM-DD");
  const end = dateRange?.end
    ? moment(dateRange.end).format("YYYY-MM-DD")
    : moment().format("YYYY-MM-DD");
  const currency =
    currencyCode || GlobalCurrency?.code || appStore.currency?.code || "UZS";

  const filterData = useMemo(
    () => ({
      periodStartDate: start,
      periodEndDate: end,
      periodType: "monthly",
      userCurrencyCode: currency,
      accounting_method: isCalculation,
      project_ids: projectGuid ? [projectGuid] : [],
      my_accounts_ids: [],
      counterparties_ids: [],
      legal_entity_ids: [],
      isEbitda: false,
      isEbit: false,
      isEbt: false,
      limit: 100,
      page: 1,
    }),
    [start, end, currency, isCalculation, projectGuid]
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["project_pnl", filterData],
    queryFn: () =>
      apiClient.invokeFunction({ method: "profit_and_loss", data: filterData }),
    select: (res) => res?.data?.data,
    enabled: !!projectGuid,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  return useMemo(() => {
    const legend = data?.legend || [];
    const rows = data?.rows || [];
    const incomeRow = rows.find(isIncomeRow);
    const expenseRow = rows.find(isExpenseRow);

    const income = incomeRow?.totalValue ?? sumValues(incomeRow);
    const expenses = expenseRow?.totalValue ?? sumValues(expenseRow);
    const profit = income - expenses;
    const profitability = income ? (profit / income) * 100 : null;

    const chartData = legend.map((p) => {
      const inc = Number(incomeRow?.values?.[p.key]) || 0;
      const exp = Number(expenseRow?.values?.[p.key]) || 0;
      return { label: p.title, income: inc, expenses: exp, profit: inc - exp };
    });

    return {
      income,
      expenses,
      profit,
      profitability,
      chartData,
      currency,
      isLoading,
      isFetching,
    };
  }, [data, currency, isLoading, isFetching]);
}

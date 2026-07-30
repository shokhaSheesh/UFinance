import { useUcodeRequestInfinite, useUcodeRequestQuery } from '@/hooks/useDashboard'
import operationsDto from '@/lib/dtos/operationsDto'
import { tips } from '@/store/operationFilter.store'
import { useMemo, useState } from 'react'

const EMPTY_FILTERS = {
  my_accounts_ids: [],
  counterparties_ids: [],
  deals: [],
  purchaseDeals: [],
}

/** Корневые разделы плана счетов, по которым фильтруем операции проекта. */
const isIncomeOrExpenseRoot = (name) => /^\s*(доход|расход)/i.test(String(name || ''))

/** Статья + все вложенные: бэк не разворачивает раздел, ids передаём явно. */
const collectAccountIds = (node) => [
  node?.guid,
  ...(node?.children || []).flatMap(collectAccountIds),
].filter(Boolean)

// Считаем сводку по операциям (для футера)
function calcStats(operations) {
  let receipts = 0
  let payments = 0
  let receiptsCount = 0
  let paymentsCount = 0
  operations.forEach((op) => {
    const amount = op.summa || 0
    if (op.tip === 'Поступление') {
      receipts += amount
      receiptsCount += 1
    } else if (op.tip === 'Выплата') {
      payments += amount
      paymentsCount += 1
    }
  })
  return { receipts, payments, receiptsCount, paymentsCount, totalCount: operations.length }
}

/**
 * Операции, привязанные к проекту (list_operations_by_query + project_ids).
 * Локальные фильтры (юрлица/счета, контрагенты, статьи, сделки) уходят в запрос.
 */
export function useProjectOperations(projectGuid) {
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  // Статьи не выбираются вручную: всегда показываем операции по разделам
  // «Доходы» и «Расходы» — их guid'ы берём из плана счетов
  const { data: chartOfAccounts, isPending: isChartLoading } = useUcodeRequestQuery({
    method: 'get_chart_of_accounts',
    data: { page: 1, limit: 100, search: '' },
    querySetting: {
      select: (res) => res?.data?.data,
      staleTime: 1000 * 60 * 30,
    },
  })

  const incomeExpenseIds = useMemo(
    () =>
      (chartOfAccounts || [])
        .filter((root) => isIncomeOrExpenseRoot(root?.nazvanie))
        .flatMap(collectAccountIds),
    [chartOfAccounts]
  )

  const requestData = useMemo(
    () => ({
      project_ids: projectGuid ? [projectGuid] : [],
      my_accounts_ids: filters.my_accounts_ids,
      counterparties_ids: filters.counterparties_ids,
      chart_of_accounts_ids: incomeExpenseIds,
      sellingDealId: filters.deals,
      purchaseDealId: filters.purchaseDeals,
      tip: tips,
      paymentConfirm: true,
      paymentNotConfirm: true,
      accrualConfirm: true,
      accrualNotConfirm: true,
      limit: 50,
    }),
    [projectGuid, filters, incomeExpenseIds]
  )

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching } =
    useUcodeRequestInfinite({
      method: 'list_operations_by_query',
      data: requestData,
      // ждём план счетов, иначе первый запрос уйдёт без фильтра по статьям
      skip: !projectGuid || isChartLoading,
    })

  const rawOps = useMemo(
    () => (data?.pages || []).flatMap((p) => p?.data?.data || []),
    [data]
  )

  const operations = useMemo(() => operationsDto(rawOps, 'all'), [rawOps])
  const operationsList = useMemo(
    () => ({
      future: operationsDto(rawOps, 'future'),
      today: operationsDto(rawOps, 'today'),
      before: operationsDto(rawOps, 'before'),
    }),
    [rawOps]
  )

  const stats = useMemo(() => calcStats(operations), [operations])
  const summary = useMemo(
    () => ({
      total: operations.length,
      incoming: stats.receipts,
      outgoing: stats.payments,
      profit: stats.receipts - stats.payments,
    }),
    [operations.length, stats]
  )

  return {
    operations,
    operationsList,
    stats,
    summary,
    filters,
    setFilters,
    isLoading: isLoading || isChartLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  }
}

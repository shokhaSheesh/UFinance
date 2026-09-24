'use client'

import {
  CASH_FLOW_STREAMS,
  findRow,
  useIndicatorBalances,
  useIndicatorCashFlow,
  useIndicatorProfit,
} from '@/components/Indicators/shared/indicatorQueries'
import { enqueueIndicatorRequest } from '@/components/Indicators/utils/requestQueue'
import { readDebtsResponse, sortDebts } from '@/components/Indicators/Debts/utils'
import { apiClient } from '@/lib/api/ucode/base'
import { listProjects, normalizeProject } from '@/lib/api/ucode/projects'
import { indicators } from '@/store/indicatos.store'
import { useQuery } from '@tanstack/react-query'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

const DEBT_METHODS = {
  debitorka: 'get_counterparties_debitorka',
  kreditorka: 'get_counterparties_kreditorka',
}

const day = (value) => (value ? moment(value).format('YYYY-MM-DD') : null)
const num = (value) => Number(value) || 0

/** Долги контрагентов — тот же запрос, что в блоке «Долги» на «Показателях». */
function useDebts(type, fallbackName) {
  const { rangeMonth, projects, deals, periodType, currencyCode, debtsLegalEntities } = indicators
  const filterData = useMemo(
    () => ({
      expired: false,
      period_from: day(rangeMonth?.start),
      period_to: day(rangeMonth?.end),
      period_type: periodType,
      legal_entity_ids: debtsLegalEntities,
      project_ids: projects,
      sellingDealId: deals,
      currencyCode,
    }),
    [rangeMonth?.start, rangeMonth?.end, periodType, currencyCode, debtsLegalEntities, projects, deals]
  )

  return useQuery({
    queryKey: [DEBT_METHODS[type], filterData],
    queryFn: () =>
      enqueueIndicatorRequest(() => apiClient.invokeFunction({ method: DEBT_METHODS[type], data: filterData })),
    select: (res) => readDebtsResponse(res, fallbackName),
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

/**
 * Данные страницы «Моя компания».
 *
 * Специально переиспользует запросы «Показателей» (P&L, ДДС, остатки,
 * долги) с теми же ключами — открытая рядом страница показателей не
 * заставляет бэкенд считать всё заново. Свои только проекты.
 */
export function useCompanyData() {
  const t = useTranslations('Company')
  const tDebts = useTranslations('Indicators')

  const profitQuery = useIndicatorProfit()
  const cashQuery = useIndicatorCashFlow()
  const balanceQuery = useIndicatorBalances()
  const debitorka = useDebts('debitorka', tDebts('debts.noName'))
  const kreditorka = useDebts('kreditorka', tDebts('debts.noName'))

  const projectsQuery = useQuery({
    queryKey: ['company_projects', indicators.rangeMonth?.start, indicators.rangeMonth?.end],
    queryFn: () =>
      enqueueIndicatorRequest(() =>
        listProjects({ page: 1, limit: 100, accounting_method: 'accrual' })
      ),
    select: (res) => (res?.data || []).map(normalizeProject),
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  // ── Доходы, расходы, прибыль по периодам ────────────────────────────────
  const pnl = useMemo(() => {
    const legend = profitQuery.data?.legend || []
    const rows = profitQuery.data?.rows || []
    const keys = legend.map((item) => item.key)
    const read = (row) => keys.map((key) => num(row?.values?.[key]))

    const revenue = read(findRow(rows, 'revenue'))
    const expenses = read(findRow(rows, 'expenses'))
    const profit = read(findRow(rows, 'net-profit'))
    const revenueTotal = revenue.reduce((a, b) => a + b, 0)
    const expensesTotal = expenses.reduce((a, b) => a + b, 0)
    const profitTotal = profit.reduce((a, b) => a + b, 0)

    return {
      legend,
      revenue,
      expenses,
      profit,
      revenueTotal,
      expensesTotal,
      profitTotal,
      margin: revenueTotal ? (profitTotal / revenueTotal) * 100 : null,
    }
  }, [profitQuery.data])

  // ── Поступления и выплаты по периодам ───────────────────────────────────
  const cash = useMemo(() => {
    const legend = cashQuery.data?.legend || []
    const rows = cashQuery.data?.rows || []
    const keys = legend.map((item) => item.key)
    const streams = rows.filter((row) => CASH_FLOW_STREAMS.includes(row.name))
    const part = (name) =>
      keys.map((key) =>
        streams
          .flatMap((stream) => stream.details?.filter((detail) => detail.name === name) || [])
          .reduce((sum, detail) => sum + Math.abs(num(detail.values?.[key])), 0)
      )

    const receipts = part('Поступления')
    const payments = part('Выплаты')
    const receiptsTotal = receipts.reduce((a, b) => a + b, 0)
    const paymentsTotal = payments.reduce((a, b) => a + b, 0)

    return { legend, receipts, payments, receiptsTotal, paymentsTotal, net: receiptsTotal - paymentsTotal }
  }, [cashQuery.data])

  // ── Остаток на счетах на сегодня ────────────────────────────────────────
  const balance = useMemo(() => {
    const accounts = balanceQuery.data
    if (!accounts?.length) return null
    const today = moment().startOf('day')
    const days = accounts[0].totalValuesByDays || []
    let index = days.findIndex((d) => moment(d.date).isSame(today, 'day'))
    if (index === -1) {
      index = days.reduce((last, d, i) => (moment(d.date).isSameOrBefore(today, 'day') ? i : last), -1)
    }
    if (index === -1) return null
    return accounts.reduce((sum, account) => sum + num(account.totalValuesByDays?.[index]?.totalInUserCurrency), 0)
  }, [balanceQuery.data])

  // ── Оборачиваемость: DSO / DPO / денежный цикл ───────────────────────────
  const turnover = useMemo(() => {
    const start = moment(indicators.rangeMonth?.start)
    const end = moment.min(moment(indicators.rangeMonth?.end), moment())
    const days = Math.max(1, end.diff(start, 'days') + 1)
    const receivables = num(debitorka.data?.total)
    const payables = num(kreditorka.data?.total)
    const dso = pnl.revenueTotal > 0 ? (receivables / pnl.revenueTotal) * days : null
    const dpo = pnl.expensesTotal > 0 ? (payables / pnl.expensesTotal) * days : null
    return {
      days,
      dso: dso == null ? null : Math.round(dso),
      dpo: dpo == null ? null : Math.round(dpo),
      cycle: dso == null || dpo == null ? null : Math.round(dso - dpo),
    }
  }, [debitorka.data, kreditorka.data, pnl.revenueTotal, pnl.expensesTotal])

  // ── Топ-5 должников и кредиторов ────────────────────────────────────────
  const topDebtors = useMemo(() => sortDebts(debitorka.data?.items || [], 'total').slice(0, 5), [debitorka.data])
  const topVendors = useMemo(() => sortDebts(kreditorka.data?.items || [], 'total').slice(0, 5), [kreditorka.data])

  // ── Проекты: рентабельность по каждому ──────────────────────────────────
  const projects = useMemo(() => {
    const list = (projectsQuery.data || [])
      .filter((project) => project.profitability != null || project.profit)
      .map((project) => ({
        id: project.id,
        name: project.name || t('noName'),
        profit: num(project.profit),
        profitability: project.profitability == null ? null : Number(project.profitability),
      }))
      .sort((a, b) => (b.profitability ?? -Infinity) - (a.profitability ?? -Infinity))
    return list.slice(0, 5)
  }, [projectsQuery.data, t])

  const averageRoi = useMemo(() => {
    const values = (projectsQuery.data || []).map((p) => p.profitability).filter((v) => v != null)
    if (!values.length) return null
    return values.reduce((a, b) => a + Number(b), 0) / values.length
  }, [projectsQuery.data])

  return {
    isLoading:
      profitQuery.isFetching ||
      cashQuery.isFetching ||
      balanceQuery.isFetching ||
      debitorka.isFetching ||
      kreditorka.isFetching,
    pnl,
    cash,
    balance,
    turnover,
    receivables: num(debitorka.data?.total),
    receivablesOverdue: num(debitorka.data?.expired),
    payables: num(kreditorka.data?.total),
    payablesOverdue: num(kreditorka.data?.expired),
    topDebtors,
    topVendors,
    projects,
    averageRoi,
  }
}

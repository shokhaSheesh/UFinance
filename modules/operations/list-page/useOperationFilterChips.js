'use client'

import { appStore } from '@/store/app.store'
import { operationFilterStore, tips } from '@/store/operationFilter.store'
import { formatAmount } from '@/utils/helpers'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

const hasRange = (range) => Boolean(range?.start || range?.end)

const formatRange = (range) => [range?.start, range?.end].filter(Boolean).join(' — ')

/**
 * Активные фильтры операций одним списком: счётчик для кнопки и чипсы над
 * таблицей строятся из одного источника, чтобы не разъезжались.
 *
 * Чипсы показывают группу и количество («Контрагенты: 3 выбрано»), а не сами
 * названия: в сторе лежат только GUID-ы, за именами пришлось бы ходить в
 * справочники. Для ответа на вопрос «что сейчас отфильтровано и как это
 * снять» группы достаточно.
 */
export function useOperationFilterChips() {
  const t = useTranslations()

  const {
    selectedFilters,
    selectedDatePaymentRange,
    selectedDateStartRange,
    selectedCounterAgents,
    selectedLegalEntities,
    selectedChartOfAccounts,
    selectedProjects,
    deals,
    purchaseDeals,
    paymentType,
    amountRange,
    paymentConfirm,
    paymentNotConfirm,
    accrualConfirm,
    accrualNotConfirm,
  } = operationFilterStore

  const safeSelectedFilters = useMemo(
    () => (Array.isArray(selectedFilters) ? selectedFilters : []),
    [selectedFilters]
  )

  const showAccrualDateFilter = appStore.interfaceSettings?.showAccrualDateFilter

  return useMemo(() => {
    const chips = []

    const pushMulti = (key, labelKey, value, reset) => {
      if (!value?.length) return
      chips.push({
        key,
        label: t(labelKey),
        value: t('filters.selectedCount', { count: value.length }),
        onRemove: reset,
      })
    }

    // Типы операций: активны, когда выбор отличается от «все разрешённые»
    const defaultTips = new Set(tips)
    const changedTypes =
      safeSelectedFilters.some((f) => !defaultTips.has(f)) ||
      tips.some((tip) => !safeSelectedFilters.includes(tip))
    if (changedTypes) {
      chips.push({
        key: 'types',
        label: t('filters.types'),
        value: t('filters.selectedCount', { count: safeSelectedFilters.length }),
        onRemove: () => operationFilterStore.setSelectedFilters(tips),
      })
    }

    if (hasRange(selectedDatePaymentRange)) {
      chips.push({
        key: 'paymentDate',
        label: t('filters.paymentDate'),
        value: formatRange(selectedDatePaymentRange),
        onRemove: () => operationFilterStore.setSelectedDatePaymentRange(null),
      })
    }

    // Скрытый фильтр «Дата начисления» не показываем — его значения
    // и в запрос не уходят (см. useOperationsFilters)
    if (showAccrualDateFilter && hasRange(selectedDateStartRange)) {
      chips.push({
        key: 'accrualDate',
        label: t('filters.accrualDate'),
        value: formatRange(selectedDateStartRange),
        onRemove: () => operationFilterStore.setSelectedDateStartRange(null),
      })
    }

    pushMulti('counterparties', 'filters.counterparties', selectedCounterAgents, () =>
      operationFilterStore.setSelectedCounterAgents([])
    )
    pushMulti('chartOfAccounts', 'filters.chartOfAccounts', selectedChartOfAccounts, () =>
      operationFilterStore.setSelectedChartOfAccounts([])
    )
    pushMulti('legalEntities', 'filters.legalEntities', selectedLegalEntities, () =>
      operationFilterStore.setSelectedLegalEntities([])
    )
    pushMulti('projects', 'filters.projects', selectedProjects, () =>
      operationFilterStore.setSelectedProjects([])
    )
    pushMulti('deals', 'filters.deals', deals, () => operationFilterStore.setSelectedDeals([]))
    pushMulti('purchaseDeals', 'filters.purchaseDeals', purchaseDeals, () =>
      operationFilterStore.setSelectedPurchaseDeals([])
    )

    if (paymentType) {
      chips.push({
        key: 'paymentType',
        label: t('filters.paymentType'),
        value: String(paymentType?.label ?? paymentType?.name ?? paymentType),
        onRemove: () => operationFilterStore.setPaymentType(null),
      })
    }

    if (amountRange?.min || amountRange?.max) {
      const min = amountRange?.min ? formatAmount(amountRange.min) : ''
      const max = amountRange?.max ? formatAmount(amountRange.max) : ''
      const value =
        min && max
          ? t('filters.amountBetween', { min, max })
          : min
            ? t('filters.amountFrom', { min })
            : t('filters.amountTo', { max })
      chips.push({
        key: 'amount',
        label: t('filters.amount'),
        value,
        onRemove: () => operationFilterStore.setAmountRange({ min: '', max: '' }),
      })
    }

    // Галочки статусов по умолчанию все включены — чипс нужен, только
    // когда пользователь что-то снял
    if (!paymentConfirm || !paymentNotConfirm) {
      chips.push({
        key: 'paymentStatus',
        label: t('filters.paymentStatus'),
        value: t('filters.selectedCount', {
          count: [paymentConfirm, paymentNotConfirm].filter(Boolean).length,
        }),
        onRemove: () => {
          operationFilterStore.setState('paymentConfirm', true)
          operationFilterStore.setState('paymentNotConfirm', true)
        },
      })
    }

    if (!accrualConfirm || !accrualNotConfirm) {
      chips.push({
        key: 'accrualStatus',
        label: t('filters.accrualStatus'),
        value: t('filters.selectedCount', {
          count: [accrualConfirm, accrualNotConfirm].filter(Boolean).length,
        }),
        onRemove: () => {
          operationFilterStore.setState('accrualConfirm', true)
          operationFilterStore.setState('accrualNotConfirm', true)
        },
      })
    }

    return { chips, count: chips.length }
  }, [
    t,
    showAccrualDateFilter,
    safeSelectedFilters,
    selectedDatePaymentRange,
    selectedDateStartRange,
    selectedCounterAgents,
    selectedLegalEntities,
    selectedChartOfAccounts,
    selectedProjects,
    deals,
    purchaseDeals,
    paymentType,
    amountRange,
    paymentConfirm,
    paymentNotConfirm,
    accrualConfirm,
    accrualNotConfirm,
  ])
}

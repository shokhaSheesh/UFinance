"use client"

import { useQueryClient } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useRef, useState } from 'react'
import { FaSortDown } from 'react-icons/fa'
import { appStore } from '../../../store/app.store'
import { allowedTip, operationFilterStore, tips } from '../../../store/operationFilter.store'
import MultiSelectStatiya from '../../ReadyComponents/MultiSelectStatiya'
import MultiSelectZdelka from '../../ReadyComponents/MultiZdelka'
import SelectCounterParties from '../../ReadyComponents/SelectCounterParties'
import SelectMyAccounts from '../../ReadyComponents/SelectMyAccounts'
import { FilterSection, FilterSidebar } from '../../directories/FilterSidebar/FilterSidebar'
import NewDateRangeComponent from '../../directories/NewDateRangeComponent'
import OperationCheckbox from '../../shared/Checkbox/operationCheckbox'
import Input from '../../shared/Input'
import SingleSelect from '../../shared/Selects/SingleSelect'

export const OperationsFiltersSidebar = observer(({
  isOpen, onClose
}) => {
  const t = useTranslations('Operations')
  const queryClient = useQueryClient()
  const {
    selectedFilters,
    selectedDatePaymentRange,
    selectedDateStartRange,
    selectedLegalEntities,
    selectedCounterAgents,
    selectedChartOfAccounts,
    paymentType,
    deals,
    paymentConfirm,
    paymentNotConfirm,
    accrualConfirm,
    accrualNotConfirm,
    amountRange
  } = operationFilterStore

  // Ensure selectedFilters is always an array
  const safeSelectedFilters = useMemo(() => Array.isArray(selectedFilters) ? selectedFilters : [], [selectedFilters])

  const [expandedFilters, setExpandedFilters] = useState({ peremescheniye: false, nachisleniye: false })
  // const [activeTab, setActiveTab] = useState('general')
  const [localAmount, setLocalAmount] = useState({ min: amountRange?.min || '', max: amountRange?.max || '' })
  const amountDebounceRef = useRef(null)

  // Calculate count of active filters
  const clearCount = useMemo(() => {
    let count = 0

    // Count non-default filters (excluding default tips)
    const defaultTips = new Set(tips)
    const hasNonDefaultFilters = safeSelectedFilters.some(f => !defaultTips.has(f))
    const hasMissingDefaultFilters = tips.some(t => !safeSelectedFilters.includes(t))
    if (hasNonDefaultFilters || hasMissingDefaultFilters) count++

    // Date ranges
    if (selectedDatePaymentRange?.start || selectedDatePaymentRange?.end) count++
    if (selectedDateStartRange?.start || selectedDateStartRange?.end) count++

    // Multi-selects
    if (selectedCounterAgents?.length) count++
    if (selectedLegalEntities?.length) count++
    if (selectedChartOfAccounts?.length) count++
    if (deals?.length) count++

    // Payment type
    if (paymentType) count++

    // Amount range
    if (amountRange?.min || amountRange?.max) count++

    // Checkboxes (if different from default all-true state)
    if (!paymentConfirm || !paymentNotConfirm || !accrualConfirm || !accrualNotConfirm) count++

    return count
  }, [safeSelectedFilters, selectedDatePaymentRange, selectedDateStartRange, selectedCounterAgents, selectedLegalEntities, selectedChartOfAccounts, deals, paymentType, amountRange, paymentConfirm, paymentNotConfirm, accrualConfirm, accrualNotConfirm])

  // Clear all filters
  const onClear = useCallback(() => {
    operationFilterStore.resetFilters()
    setLocalAmount({ min: '', max: '' })
    queryClient.invalidateQueries({ queryKey: ['find_operations'] })
  }, [queryClient])

  const handleAmountChange = useCallback((field, rawValue) => {
    const digitsOnly = rawValue.replace(/[^0-9]/g, '')
    setLocalAmount(prev => ({ ...prev, [field]: digitsOnly }))
    if (amountDebounceRef.current) clearTimeout(amountDebounceRef.current)
    amountDebounceRef.current = setTimeout(() => {
      operationFilterStore.setAmountRange(prev => ({ ...prev, [field]: digitsOnly }))
    }, 200)
  }, [])




  return (
    <>
      <FilterSidebar isOpen={isOpen} onClose={onClose} clearCount={clearCount} onClear={onClear}>
        {/* Тип операции */}
        <FilterSection title={t('filters.operationType')} className="mb-5">
          {/* Поступление */}
          <div className="flex flex-col gap-3 justify-start items-start">
            {allowedTip.allowIncome && <OperationCheckbox
              checked={safeSelectedFilters.includes('Поступление')}
              onChange={() => operationFilterStore.toggleFilter('Поступление')}
              label={t('filters.income')}
            />}

            {/* Выплата */}
            {allowedTip.allowPayout && <OperationCheckbox
              checked={safeSelectedFilters.includes('Выплата')}
              onChange={() => operationFilterStore.toggleFilter('Выплата')}
              label={t('filters.payout')}
            />}


            {/* Перемещение */}
            {allowedTip.allowTransfer && <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                <OperationCheckbox
                  checked={safeSelectedFilters.includes('Перемещение')}
                  onChange={() => operationFilterStore.toggleComplexFilter('Перемещение')}
                  label={t('filters.transfer')}
                />
                <FaSortDown
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    transform: expandedFilters.peremescheniye ? 'rotate(0deg)' : 'rotate(-180deg)',
                    marginBottom: expandedFilters.peremescheniye ? '10px' : '0',
                    color: '#6b7280',
                    fontSize: '12px'
                  }}
                  onClick={() => setExpandedFilters(prev => ({ ...prev, peremescheniye: !prev.peremescheniye }))}
                />
              </div>
              {expandedFilters.peremescheniye && (
                <div style={{ paddingLeft: '1.25rem', display: 'flex', alignItems: 'flex-start', flexDirection: 'column', gap: '0.75rem' }}>
                  <OperationCheckbox
                    checked={safeSelectedFilters.includes('Списание')}
                    onChange={() => operationFilterStore.toggleFilter('Списание')}
                    label={t('filters.writeOff')}
                  />
                  <OperationCheckbox
                    checked={safeSelectedFilters.includes('Зачисление')}
                    onChange={() => operationFilterStore.toggleFilter('Зачисление')}
                    label={t('filters.enrollment')}
                  />
                </div>
              )}
            </>}

            {/* Начисление */}
            {allowedTip.allowAccrual && <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                <OperationCheckbox
                  checked={safeSelectedFilters.includes('Начисление')}
                  onChange={() => operationFilterStore.toggleComplexFilter('Начисление')}
                  label={t('filters.accrual')}
                />
                <FaSortDown
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    transform: expandedFilters.nachisleniye ? 'rotate(0deg)' : 'rotate(-180deg)',
                    marginBottom: expandedFilters.nachisleniye ? '10px' : '0',
                    color: '#6b7280',
                    fontSize: '12px'
                  }}
                  onClick={() => setExpandedFilters(prev => ({ ...prev, nachisleniye: !prev.nachisleniye }))}
                />
              </div>
              {expandedFilters.nachisleniye && (
                <div style={{ paddingLeft: '1.25rem', display: 'flex', alignItems: 'flex-start', flexDirection: 'column', gap: '0.75rem' }}>
                  <OperationCheckbox
                    checked={safeSelectedFilters.includes('Дебет')}
                    onChange={() => operationFilterStore.toggleFilter('Дебет')}
                    label={t('filters.debit')}
                  />
                  <OperationCheckbox
                    checked={safeSelectedFilters.includes('Кредит')}
                    onChange={() => operationFilterStore.toggleFilter('Кредит')}
                    label={t('filters.credit')}
                  />
                </div>
              )}
            </>}
            {/* Отгрузка */}
            {allowedTip.allowShipment && <OperationCheckbox
              checked={safeSelectedFilters.includes('Отгрузка')}
              onChange={() => operationFilterStore.toggleFilter('Отгрузка')}
              label={t('filters.shipment')}
            />}
          </div>
        </FilterSection>

        {/* Дата оплаты - упрощенная версия, полная версия будет в отдельном компоненте */}
        <FilterSection title={t('filters.paymentDate')} className="mb-5">
          <div className="space-y-3">
            <OperationCheckbox
              checked={paymentConfirm}
              onChange={(event) => operationFilterStore.setState('paymentConfirm', event.target?.checked)}
              label={t('filters.confirmed')}
            />
            <OperationCheckbox
              checked={paymentNotConfirm}
              onChange={(event) => operationFilterStore.setState('paymentNotConfirm', event.target?.checked)}
              label={t('filters.notConfirmed')}
            />
          </div>
          {/* CustomDatePicker for date payment range */}
          <NewDateRangeComponent
            value={selectedDatePaymentRange}
            onChange={(val) => operationFilterStore.setSelectedDatePaymentRange(val)}
          />
        </FilterSection>

        <FilterSection title={t('filters.accrualDate')} className="mb-5">
          <div className="space-y-3">
            <OperationCheckbox
              checked={accrualConfirm}
              onChange={(event) => operationFilterStore.setState('accrualConfirm', event.target?.checked)}
              label={t('filters.confirmed')}
            />
            <OperationCheckbox
              checked={accrualNotConfirm}
              onChange={(event) => operationFilterStore.setState('accrualNotConfirm', event.target?.checked)}
              label={t('filters.notConfirmed')}
            />
          </div>
          {/* CustomDatePicker for date start range */}
          <NewDateRangeComponent
            value={selectedDateStartRange}
            onChange={(val) => operationFilterStore.setSelectedDateStartRange(val)}
          />
        </FilterSection>

        {/* Параметры */}
        <FilterSection title={t('filters.parameters')} className="mb-5">
          <div className="flex flex-col gap-2">
            {/* Юрлица */}
            <SelectMyAccounts
              value={selectedLegalEntities}
              onChange={(val) => operationFilterStore.setSelectedLegalEntities(val)}
              placeholder={t('filters.legalEntitiesPlaceholder')}
              className={'bg-gray-ucode-25'}
              multi={true}
            />

            {/* Контрагенты */}
            <SelectCounterParties
              value={selectedCounterAgents}
              onChange={(val) => operationFilterStore.setSelectedCounterAgents(val)}
              placeholder={t('filters.counterpartiesPlaceholder')}
              className={'bg-gray-ucode-25'}
            />

            {/* Payment filter  */}
            {appStore.isPayment && <SingleSelect
              data={[{ label: t('paymentTypes.cash'), value: 'cash' }, { label: t('paymentTypes.card'), value: 'card' }, { value: 'transfer', label: t('paymentTypes.transfer') }]}
              value={paymentType}
              onChange={(val) => operationFilterStore.setPaymentType(val)}
              isClearable={false}
              placeholder={t('filters.paymentTypePlaceholder')}
              className={'bg-gray-ucode-25'}
            />}


            {/* Статьи учета */}
            <MultiSelectStatiya
              value={selectedChartOfAccounts}
              onChange={(val) => operationFilterStore.setSelectedChartOfAccounts(val)}
              placeholder={t('filters.chartOfAccountsPlaceholder')}
              type=""
              dropdownClassName={'w-64'}
              className={'bg-gray-ucode-25'}
            />

            <MultiSelectZdelka
              value={deals}
              onChange={(val) => operationFilterStore.setSelectedDeals(val)}
              placeholder={t('filters.dealsPlaceholder')}
              className={'bg-gray-ucode-25'}
            />

            {/* Price */}
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                action="filter"
                placeholder={t('filters.amountFrom')}
                value={localAmount.min}
                onChange={(e) => handleAmountChange('min', e.target.value)}
                className="h-[34px]! bg-gray-ucode-25"
              />
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>–</span>
              <Input
                type="text"
                inputMode="numeric"
                action="filter"
                placeholder={t('filters.amountTo')}
                value={localAmount.max}
                onChange={(e) => handleAmountChange('max', e.target.value)}
                className="h-[34px]! bg-gray-ucode-25"
              />
            </div>
          </div>
        </FilterSection>
      </FilterSidebar>
    </>
  )
})



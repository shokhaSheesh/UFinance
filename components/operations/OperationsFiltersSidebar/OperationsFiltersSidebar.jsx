"use client"

import { useQueryClient } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import { useCallback, useRef, useState } from 'react'
import { FaSortDown } from 'react-icons/fa'
import { appStore } from '../../../store/app.store'
import { allowedTip, operationFilterStore } from '../../../store/operationFilter.store'
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
  isOpen, onClose, clearCount, onClear
}) => {
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
    accrualNotConfirm
  } = operationFilterStore

  // Ensure selectedFilters is always an array
  const safeSelectedFilters = Array.isArray(selectedFilters) ? selectedFilters : []

  const [expandedFilters, setExpandedFilters] = useState({ peremescheniye: false, nachisleniye: false })
  // const [activeTab, setActiveTab] = useState('general')
  const [localAmount, setLocalAmount] = useState({ min: '', max: '' })
  const amountDebounceRef = useRef(null)

  const handleChangeFilter = useCallback(() => {
    // control all filters values here adter that call find_operations with queryClient.invalidateQueries
    queryClient.invalidateQueries({ queryKey: ['find_operations'] })
  }, [queryClient])

  const handleAmountChange = useCallback((field, rawValue) => {
    const digitsOnly = rawValue.replace(/[^0-9]/g, '')
    setLocalAmount(prev => ({ ...prev, [field]: digitsOnly }))
    if (amountDebounceRef.current) clearTimeout(amountDebounceRef.current)
    amountDebounceRef.current = setTimeout(() => {
      operationFilterStore.setAmountRange(prev => ({ ...prev, [field]: digitsOnly }))
      handleChangeFilter()
    }, 200)
  }, [handleChangeFilter])




  return (
    <>
      <FilterSidebar isOpen={isOpen} onClose={onClose} clearCount={clearCount} onClear={onClear}>
        {/* Тип операции */}
        <FilterSection title="Тип операции" className="mb-5">
          {/* Поступление */}
          <div className="flex flex-col gap-3 justify-start items-start">
            {allowedTip.allowIncome && <OperationCheckbox
              checked={safeSelectedFilters.includes('Поступление')}
              onChange={() => {
                operationFilterStore.toggleFilter('Поступление')
                handleChangeFilter()
              }}
              label="Поступление"
            />}

            {/* Выплата */}
            {allowedTip.allowPayout && <OperationCheckbox
              checked={safeSelectedFilters.includes('Выплата')}
              onChange={() => {
                operationFilterStore.toggleFilter('Выплата')
                handleChangeFilter()
              }}
              label="Выплата"
            />}


            {/* Перемещение */}
            {allowedTip.allowTransfer && <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                <OperationCheckbox
                  checked={safeSelectedFilters.includes('Перемещение')}
                  onChange={() => {
                    operationFilterStore.toggleComplexFilter('Перемещение')
                    handleChangeFilter()
                  }}
                  label="Перемещение"
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
                    onChange={() => {
                      operationFilterStore.toggleFilter('Списание')
                      handleChangeFilter()
                    }}
                    label="Списание"
                  />
                  <OperationCheckbox
                    checked={safeSelectedFilters.includes('Зачисление')}
                    onChange={() => {
                      operationFilterStore.toggleFilter('Зачисление')
                      handleChangeFilter()
                    }}
                    label="Зачисление"
                  />
                </div>
              )}
            </>}

            {/* Начисление */}
            {allowedTip.allowAccrual && <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                <OperationCheckbox
                  checked={safeSelectedFilters.includes('Начисление')}
                  onChange={() => {
                    operationFilterStore.toggleComplexFilter('Начисление')
                    handleChangeFilter()
                  }}
                  label="Начисление"
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
                    onChange={() => {
                      operationFilterStore.toggleFilter('Дебет')
                      handleChangeFilter()
                    }}
                    label="Дебет"
                  />
                  <OperationCheckbox
                    checked={safeSelectedFilters.includes('Кредит')}
                    onChange={() => {
                      operationFilterStore.toggleFilter('Кредит')
                      handleChangeFilter()
                    }}
                    label="Кредит"
                  />
                </div>
              )}
            </>}
            {/* Отгрузка */}
            {allowedTip.allowShipment && <OperationCheckbox
              checked={safeSelectedFilters.includes('Отгрузка')}
              onChange={() => {
                operationFilterStore.toggleFilter('Отгрузка')
                handleChangeFilter()
              }}
              label="Отгрузка"
            />}
          </div>
        </FilterSection>

        {/* Дата оплаты - упрощенная версия, полная версия будет в отдельном компоненте */}
        <FilterSection title="Дата оплаты" className="mb-5">
          <div className="space-y-3">
            <OperationCheckbox
              checked={paymentConfirm}
              onChange={(event) => {
                operationFilterStore.setState('paymentConfirm', event.target?.checked)
                handleChangeFilter()
              }}
              label={'Подтверждена'}
            />
            <OperationCheckbox
              checked={paymentNotConfirm}
              onChange={(event) => {
                operationFilterStore.setState('paymentNotConfirm', event.target?.checked)
                handleChangeFilter()
              }}
              label={'Не подтверждена'}
            />
          </div>
          {/* CustomDatePicker for date payment range */}
          <NewDateRangeComponent
            value={selectedDatePaymentRange}
            onChange={(val) => {
              operationFilterStore.setSelectedDatePaymentRange(val)
              handleChangeFilter()
            }}
          />
        </FilterSection>

        <FilterSection title="Дата начисления" className="mb-5">
          <div className="space-y-3">
            <OperationCheckbox
              checked={accrualConfirm}
              onChange={(event) => {
                operationFilterStore.setState('accrualConfirm', event.target?.checked)
                handleChangeFilter()
              }}
              label={'Подтверждена'}
            />
            <OperationCheckbox
              checked={accrualNotConfirm}
              onChange={(event) => {
                operationFilterStore.setState('accrualNotConfirm', event.target?.checked)
                handleChangeFilter()
              }}
              label={'Не подтверждена'}
            />
          </div>
          {/* CustomDatePicker for date start range */}
          <NewDateRangeComponent
            value={selectedDateStartRange}
            onChange={(val) => {
              operationFilterStore.setSelectedDateStartRange(val)
              handleChangeFilter()
            }}
          />
        </FilterSection>

        {/* Параметры */}
        <FilterSection title="Параметры" className="mb-5">
          <div className="flex flex-col gap-2">
            {/* Юрлица */}
            <SelectMyAccounts
              value={selectedLegalEntities}
              onChange={(val) => {
                operationFilterStore.setSelectedLegalEntities(val)
                handleChangeFilter()
              }}
              placeholder="Юрлица и счета"
              className={'bg-gray-ucode-25'}
            />

            {/* Контрагенты */}
            <SelectCounterParties
              value={selectedCounterAgents}
              onChange={(val) => {
                operationFilterStore.setSelectedCounterAgents(val)
                handleChangeFilter()
              }}
              placeholder="Контрагенты"
              className={'bg-gray-ucode-25'}
            />

            {/* Payment filter  */}
            {appStore.isPayment && <SingleSelect
              data={[{ label: 'Наличный', value: 'cash' }, { label: 'Карта', value: 'card' }, { value: 'transfer', label: 'Перечисление' }]}
              value={paymentType}
              onChange={(val) => {
                operationFilterStore.setPaymentType(val)
                handleChangeFilter()
              }}
              isClearable={false}
              placeholder='Тип платежа'
              className={'bg-gray-ucode-25'}
            />}


            {/* Статьи учета */}
            <MultiSelectStatiya
              value={selectedChartOfAccounts}
              onChange={(val) => {
                operationFilterStore.setSelectedChartOfAccounts(val)
                handleChangeFilter()
              }}
              placeholder="Статьи учета"
              type=""
              dropdownClassName={'w-64'}
              className={'bg-gray-ucode-25'}
            />

            <MultiSelectZdelka
              value={deals}
              onChange={(val) => {
                operationFilterStore.setSelectedDeals(val)
                handleChangeFilter()
              }}
              placeholder="Сделки"
              className={'bg-gray-ucode-25'}
            />

            {/* Price */}
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                action="filter"
                placeholder="Сумма от"
                value={localAmount.min}
                onChange={(e) => handleAmountChange('min', e.target.value)}
                className="h-[34px]! bg-gray-ucode-25"
              />
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>–</span>
              <Input
                type="text"
                inputMode="numeric"
                action="filter"
                placeholder="до"
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



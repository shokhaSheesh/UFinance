'use client'
import { cn } from '@/app/lib/utils'
import { useEffect, useMemo, useReducer, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { appStore } from '../../../../../store/app.store'

// Hooks
import { } from '@/hooks/useDashboard'

// Helpers
import { formatDate, isFuture } from '@/utils/formatDate'

// Components
import SelectMyAccounts from '../../../../ReadyComponents/SelectMyAccounts'
import SingleCounterParty from '../../../../ReadyComponents/SingleCounterParty'
import SinglSelectStatiya from '../../../../ReadyComponents/SingleSelectStatiya'
import SingleZdelka from '../../../../ReadyComponents/SingleZdelka'
import OperationCheckbox from '../../../../shared/Checkbox/operationCheckbox'
import CustomDatePicker from '../../../../shared/DatePicker'
import Input from '../../../../shared/Input'
import SingleSelect from '../../../../shared/Selects/SingleSelect'
import TextArea from '../../../../shared/TextArea'
import SplitAmount from '../../SplitAmount'

// Icons
import { Loader2 } from 'lucide-react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { CreditIcon, DebitIcon } from '../../../../../constants/icons'
import { useUcodeRequestMutation } from '../../../../../hooks/useDashboard'
import { queryClient } from '../../../../../lib/queryClient'
import { authStore } from '../../../../../store/auth.store'
import { formatDecimal, formatNumber, StringtoNumber } from '../../../../../utils/helpers'

// ── Reducer Logic ──────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]

const emptyRow = (preselectedCounterparty = '') => ({
  calculationDate: today,
  isCalculationCommitted: true,
  contrAgentId: preselectedCounterparty,
  operationCategoryId: '',
  value: '',
  percent: '',
})

function rowsReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const newState = [...state, emptyRow()]
      const count = newState.length
      const totalAmount = parseFloat(action.amount) || 0
      const equalValue = Math.floor((totalAmount / count) * 100) / 100
      const equalPercent = Math.floor((100 / count) * 100) / 100
      const lastValue = +(totalAmount - equalValue * (count - 1)).toFixed(2)
      const lastPercent = +(100 - equalPercent * (count - 1)).toFixed(2)

      return newState.map((row, i) => ({
        ...row,
        value: i === count - 1 ? String(lastValue) : String(equalValue),
        percent: i === count - 1 ? String(Number(lastPercent).toFixed(2)).replace('.00', '') : String(Number(equalPercent).toFixed(2)).replace('.00', ''),
      }))
    }
    case 'REMOVE': {
      const newState = state.filter((_, i) => i !== action.index)
      const count = newState.length
      if (count === 0) return newState
      const totalAmount = parseFloat(action.amount) || 0
      const remainingPercentSum = newState.reduce((s, r) => s + (parseFloat(r.percent) || 0), 0)

      if (remainingPercentSum > 0) {
        let remainingValueForFinal = totalAmount
        let remainingPercentForFinal = 100
        return newState.map((row, i) => {
          if (i === count - 1) {
            return {
              ...row,
              value: String(remainingValueForFinal.toFixed(2)).replace('.00', ''),
              percent: String(remainingPercentForFinal.toFixed(2)).replace('.00', '')
            }
          }
          const rowPercent = parseFloat(row.percent) || 0
          const scaledPercent = (rowPercent / remainingPercentSum) * 100
          const rowValue = Math.floor(totalAmount * (scaledPercent / 100) * 100) / 100
          const calculatedPercent = Math.floor(scaledPercent * 100) / 100

          remainingValueForFinal -= rowValue
          remainingPercentForFinal -= calculatedPercent

          return {
            ...row,
            value: String(rowValue.toFixed(2)).replace('.00', ''),
            percent: String(calculatedPercent.toFixed(2)).replace('.00', '')
          }
        })
      } else {
        const equalValue = Math.floor((totalAmount / count) * 100) / 100
        const equalPercent = Math.floor((100 / count) * 100) / 100
        const lastValue = +(totalAmount - equalValue * (count - 1)).toFixed(2)
        const lastPercent = +(100 - equalPercent * (count - 1)).toFixed(2)
        return newState.map((row, i) => ({
          ...row,
          value: i === count - 1 ? String(lastValue) : String(equalValue),
          percent: i === count - 1 ? String(Number(lastPercent).toFixed(2)).replace('.00', '') : String(Number(equalPercent).toFixed(2)).replace('.00', ''),
        }))
      }
    }
    case 'UPDATE': {
      if (action.field === 'calculationDate') {
        const pickDate = Number(action.value?.slice(-2))
        const isFutureDate = pickDate > (new Date().getDate())
        return state.map((row, i) =>
          i === action.index ? { ...row, [action.field]: action.value, isCalculationCommitted: !isFutureDate } : row
        )
      }
      if (action.field === 'value' && action.amount) {
        const numAmount = Number(String(action.amount).replace(/\s/g, ''))
        let percent = ''
        if (numAmount > 0 && action.value !== '') {
          percent = String(Number((Number(action.value) / numAmount) * 100).toFixed(2))
          if (percent.endsWith('.00')) percent = parseInt(percent).toString()
        }
        let newState = state.map((row, i) =>
          i === action.index ? { ...row, value: action.value, percent } : row
        )

        if (numAmount > 0) {
          const totalValues = newState.reduce((s, r) => s + (Number(String(r.value).replace(/\s/g, '')) || 0), 0)
          if (Math.abs(totalValues - numAmount) < 0.01) {
            const totalPercent = newState.reduce((s, r) => s + (parseFloat(r.percent) || 0), 0)
            if (Math.abs(totalPercent - 100) > 0.001) {
              const residual = 100 - (totalPercent - (parseFloat(percent) || 0));
              newState = newState.map((row, i) =>
                i === action.index ? {
                  ...row,
                  percent: String(Number(residual).toFixed(2)).replace('.00', '')
                } : row
              )
            }
          }
        }
        return newState
      }
      if (action.field === 'percent' && action.amount) {
        const numAmount = Number(String(action.amount).replace(/\s/g, ''))
        let value = ''
        let calculatedValueStr = ''
        if (numAmount > 0 && action.value !== '') {
          value = String(((Number(action.value) / 100) * numAmount).toFixed(2))
          calculatedValueStr = value.endsWith('.00') ? parseInt(value).toString() : value
        }
        let newState = state.map((row, i) =>
          i === action.index ? { ...row, percent: action.value, value: calculatedValueStr } : row
        )

        if (numAmount > 0) {
          const totalPercents = newState.reduce((s, r) => s + (parseFloat(r.percent) || 0), 0)
          if (Math.abs(totalPercents - 100) < 0.01) {
            const totalValues = newState.reduce((s, r) => s + (Number(String(r.value).replace(/\s/g, '')) || 0), 0)
            if (Math.abs(totalValues - numAmount) > 0.001) {
              const residualValue = numAmount - (totalValues - (Number(calculatedValueStr) || 0));
              newState = newState.map((row, i) =>
                i === action.index ? {
                  ...row,
                  value: String(Number(residualValue).toFixed(2)).replace('.00', '')
                } : row
              )
            }
          }
        }
        return newState
      }
      return state.map((row, i) =>
        i === action.index ? { ...row, [action.field]: action.value } : row
      )
    }
    case 'RECALCULATE_VALUES': {
      const totalAmount = parseFloat(action.amount) || 0
      if (state.length === 0 || totalAmount === 0) return state

      const currentTotalPercent = state.reduce((s, r) => s + (parseFloat(r.percent) || 0), 0)
      const scaleRatio = currentTotalPercent > 0 ? (100 / currentTotalPercent) : 0

      let remainingValue = totalAmount
      let remainingPercent = 100
      const lastIdx = state.length - 1

      return state.map((row, i) => {
        if (i === lastIdx) {
          return {
            ...row,
            value: String(remainingValue.toFixed(2)).replace('.00', ''),
            percent: String(remainingPercent.toFixed(2)).replace('.00', '')
          }
        }
        const rowPercent = parseFloat(row.percent) || 0
        const targetPercent = rowPercent * scaleRatio

        const rowValue = Math.floor(totalAmount * (targetPercent / 100) * 100) / 100
        const actualPercent = Math.floor(targetPercent * 100) / 100

        remainingValue -= rowValue
        remainingPercent -= actualPercent
        return {
          ...row,
          value: String(rowValue.toFixed(2)).replace('.00', ''),
          percent: String(actualPercent.toFixed(2)).replace('.00', '')
        }
      })
    }
    case 'DIVIDE_EQUAL': {
      const count = state.length
      if (count === 0) return state
      const totalAmount = parseFloat(String(action?.amount)?.replace(/\s/g, '')) || 0
      const equalValue = parseFloat((totalAmount / count).toFixed(2))
      const equalPercent = Math.floor(100 / count)
      const lastValue = parseFloat((totalAmount - equalValue * (count - 1)).toFixed(2))
      const lastPercent = 100 - equalPercent * (count - 1)
      return state.map((row, i) => ({
        ...row,
        value: i === count - 1 ? String(lastValue).replace('.00', '') : String(equalValue).replace('.00', ''),
        percent: i === count - 1 ? String(lastPercent) : String(equalPercent),
      }))
    }
    case 'RESET':
      return [emptyRow()]
    case 'SET_ROWS':
      return action.payload
    default:
      return state
  }
}

// ── Main Component ──────────────────────────────────────────

const PaymentForm = observer(({
  initialData,
  onClose,
  preselectedCounterparty = null,
  defaultDealGuid = null,
  chart_of_accounts_id = null
}) => {



  // Form State
  const isNew = initialData?.isNew
  const defaultValues = useMemo(() => {
    if (initialData && (!isNew || initialData.isCopy)) {
      const raw = initialData
      const paymentDate = raw.data_operatsii ? formatDate(raw.data_operatsii) : formatDate(new Date())
      const accrualDate = raw.data_nachisleniya ? formatDate(raw.data_nachisleniya) : paymentDate

      return {
        paymentDate,
        confirmPayment: raw.payment_confirmed !== undefined ? raw.payment_confirmed : !!raw.oplata_podtverzhdena,
        accountAndLegalEntity: raw.my_accounts_id || raw.bank_accounts_id || null,
        amount: preselectedCounterparty ? (raw?.operationParts?.reduce((acc, part) => acc + part.summa, 0) || 0) : raw?.summa || 0,
        accrualDate,
        confirmAccrual: raw.payment_accrual !== undefined ? raw.payment_accrual : false,
        counterparty: raw.counterparties_id || preselectedCounterparty || null,
        chartOfAccount: raw.chart_of_accounts_id || chart_of_accounts_id || null, // Simplified logic
        paymentType: 'transfer',
        salesDeal: raw.selling_deal_id || defaultDealGuid || null,
        purpose: raw.opisanie || '',
        currency: raw.currenies_id || 'RUB',
      }
    }

    return {
      paymentDate: formatDate(new Date()),
      confirmPayment: true,
      accountAndLegalEntity: null,
      amount: '',
      accrualDate: formatDate(new Date()),
      confirmAccrual: true,
      counterparty: preselectedCounterparty || null,
      chartOfAccount: chart_of_accounts_id || null,
      paymentType: 'transfer',
      salesDeal: defaultDealGuid || null,
      purpose: '',
      currency: '',
    }
  }, [initialData, isNew, chart_of_accounts_id, preselectedCounterparty, defaultDealGuid])

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues
  })

  const { mutateAsync: createOperation, isPending } = useUcodeRequestMutation()



  // Amount Splitting State
  const [rows, dispatch] = useReducer(rowsReducer, [emptyRow(preselectedCounterparty), emptyRow()])
  const [selectedSplits, setSelectedSplits] = useState([])
  const [divivedAmounts, setdivivedAmounts] = useState([])
  const [title, setTitle] = useState()

  // Initialize splits and rows if editing existing operation
  useEffect(() => {
    if (initialData && (!isNew || initialData.isCopy) && initialData.operationParts?.length > 0) {
      const parts = initialData.operationParts

      const newSplits = []
      if (parts.some(p => p.data_nachisleniya)) newSplits.push({ value: 'Начисление', label: 'Начисление' })
      if (parts.some(p => p.counterparties_id)) newSplits.push({ value: 'Контрагент', label: 'Контрагент' })
      if (parts.some(p => p.chart_of_accounts_id)) newSplits.push({ value: 'Статья', label: 'Статья' })
      setSelectedSplits(newSplits)

      const mappedRows = parts.map(p => ({
        calculationDate: p.data_nachisleniya ? formatDate(p.data_nachisleniya) : today,
        isCalculationCommitted: p.payment_accrual ?? true,
        contrAgentId: p.counterparties_id || '',
        operationCategoryId: p.chart_of_accounts_id || '',
        value: String(Math.abs(p.summa || 0)),
        percent: String(p.percent || '')
      }))
      dispatch({ type: 'SET_ROWS', payload: mappedRows })
    }
  }, [initialData, isNew])


  const has = (label) => selectedSplits.some(s => s.value === label)
  const showDate = has('Начисление')
  const showAgent = has('Контрагент')
  const showStatya = has('Статья')

  // Watch values
  const watchAccount = watch('accountAndLegalEntity')
  const watchAmount = watch('amount')
  const watchSalesDeal = watch('salesDeal')
  const watchPaymentDate = watch('paymentDate')

  console.log(!!watchSalesDeal, 'watchSalesDeal')
  const watchAccrualDate = watch('accrualDate')
  const watchConfirmPayment = watch('confirmPayment')
  const watchConfirmAccrual = watch('confirmAccrual')

  // Derived flags
  const isDebit = (!showDate && watchConfirmPayment && !watchConfirmAccrual)
  const isCredit = (!showDate && !watchConfirmPayment && watchConfirmAccrual)

  const onSubmit = async (data) => {


    const payload = {
      tip: ['Выплата'],
      summa: formatDecimal(StringtoNumber(data?.amount)),
      data_operatsii: data?.paymentDate,
      data_nachisleniya: data?.accrualDate,
      payment_confirmed: data?.confirmPayment,
      payment_accrual: data?.confirmAccrual,
      currenies_id: appStore?.currency?.guid,
      my_accounts_id: watchAccount,
      legal_entity_id: authStore?.userData?.legal_entity_id,
      chart_of_accounts_id: chart_of_accounts_id || data?.chartOfAccount,
      sales_transactions_id: watchSalesDeal,
      counterparties_id: data?.counterparty,
      comment: watch('purpose'),
      currenies_id: data?.currency,
    }

    if (divivedAmounts.length > 0) {
      payload.items = divivedAmounts.map(item => ({
        summa: formatDecimal(StringtoNumber(item?.value)),
        percent: Number(item?.percent),
        data_nachisleniya: moment(showDate && !watchSalesDeal ? (item?.calculationDate) : data?.accrualDate).format('YYYY-MM-DD'),
        payment_accrual: showDate && !watchSalesDeal ? item?.isCalculationCommitted : data?.confirmAccrual,
        counterparties_id: showAgent ? (item?.contrAgentId || null) : null,
        chart_of_accounts_id: showStatya ? (item?.operationCategoryId || null) : null,
      }))
    }

    if (!isNew) {
      payload.guid = initialData.guid
    }

    try {

      await createOperation({
        method: isNew ? 'create_operation' : 'update_operation',
        data: payload
      })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['operationsList'] })
      queryClient.invalidateQueries({ queryKey: ['operations'] })
      queryClient.invalidateQueries({ queryKey: ['find_operations'] })
      queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
      queryClient.invalidateQueries({ queryKey: ['get_sales_transaction_by_guid'] })
      queryClient.invalidateQueries({ queryKey: ['myAccountsBoard'] })
      queryClient.invalidateQueries({ queryKey: ['legal_entities'] })
      queryClient.invalidateQueries({ queryKey: ['legalEntitiesPlanFact'] })
      queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
      queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })
      onClose?.()
    } catch (error) {
      console.error('IncomeForm onSubmit error', error)
    }
  }

  const handleSelectMyAccount = (value) => {
    setValue('currency', value)
    const selected = toJS(appStore.currencies).find(c => c.guid === value)
    setTitle(`${selected.kod} ${selected.nazvanie}`)
  }

  const totalSplitValue = divivedAmounts.reduce((acc, curr) => acc + Number(String(curr.value).replace(/\s/g, '') || 0), 0)
  const amountToNumber = Number(StringtoNumber(watchAmount))
  const isSplitExceeded = divivedAmounts.length > 0 && amountToNumber > 0 && totalSplitValue > amountToNumber
  const canSubmit = !isSplitExceeded

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col h-full overflow-hidden text-slate-900">
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 flex flex-col gap-5">
          {/* SECTION: ОПЛАТА */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <label className="w-[150px] text-xss!">Дата оплаты</label>
              <div className="flex-1 flex gap-2 max-w-[600px]">
                <Controller
                  name="paymentDate"
                  control={control}
                  render={({ field }) => (
                    <CustomDatePicker
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val)
                        setValue('confirmPayment', !isFuture(val))
                        if (watchSalesDeal) {
                          setValue('accrualDate', val)
                        }
                      }}
                      placeholder="Выберите дату"
                      format='YYYY-MM-DD'
                      className={cn("w-[180px]!", errors.paymentDate && "border-red-500")}
                    />
                  )}
                />
                <Controller
                  name="confirmPayment"
                  control={control}
                  render={({ field }) => (
                    <OperationCheckbox
                      checked={field.value}
                      label="Подтвердить оплату"
                      onChange={(e) => {
                        if (isFuture(watchPaymentDate)) return
                        field.onChange(e.target.checked)
                      }}
                    />
                  )}
                />
              </div>
            </div>
            {/* Счет и юрлицо */}
            <div className="flex items-center gap-4">
              <label className="w-[150px] text-xss">Счет и юрлицо <span className="text-red-500 ml-0.5">*</span></label>
              <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
                <Controller
                  name="accountAndLegalEntity"
                  control={control}
                  rules={{ required: 'Выберите счет и юрлицо' }}
                  render={({ field }) => (
                    <SelectMyAccounts
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val)
                        setTitle('')
                      }}
                      multi={false}
                      type="show"
                      extraValue="currenies_id"
                      returnValue={handleSelectMyAccount}
                      placeholder="Юрлица и счета"
                      className="bg-white border rounded-md h-[36px]!"
                      hasError={errors.accountAndLegalEntity}
                    />
                  )}
                />
                {errors.accountAndLegalEntity && <span className="text-xs text-red-500">{errors.accountAndLegalEntity.message}</span>}
              </div>
            </div>

            {/* Сумма */}
            <div className="flex flex-col gap-2 max-w-full">
              <div className="flex items-start gap-4">
                <label className="min-w-[150px] text-xss mt-2">Сумма</label>
                <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                  <div className="flex items-center gap-3">
                    <Controller
                      name="amount"
                      control={control}
                      render={({ field }) => (
                        <div className='flex items-center gap-2'>
                          <Input
                            type="text"
                            value={formatNumber(field.value)}
                            onChange={(e) => field.onChange(formatNumber(e.target.value))}
                            placeholder="Сумму"
                            className={cn("w-[230px]", errors.amount && "border-red-500")}
                          />
                          <span className="flex items-center gap-2">
                            {isDebit && <DebitIcon />}
                            {isCredit && <CreditIcon />}
                          </span>
                        </div>
                      )}
                    />
                    <p className='text-xss text-black font-medium text-end w-full line-clamp-1'>{title}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <SplitAmount
                      amount={watchAmount}
                      onChange={setdivivedAmounts}
                      rows={rows}
                      modalType={'payment'}
                      dispatch={dispatch}
                      salesDeal={watchSalesDeal}
                      confirmAccural={watchConfirmAccrual}
                      confirmPayment={watchConfirmPayment}
                      selectedSplits={selectedSplits}
                      setSelectedSplits={setSelectedSplits}
                      initiallyOpen={initialData?.operationParts?.length > 0}
                    />
                  </div>
                </div>
              </div>

              {/* Split Amount */}

            </div>
          </div>

          {/* SECTION: ДЕТАЛИ */}
          <div className="flex flex-col gap-5 mt-4">

            {!showDate && (
              <div className={cn("flex items-center gap-4", watchSalesDeal && "opacity-50")}>
                <label className="w-[150px] text-xss!">Дата начисления</label>
                <div className="flex-1 flex gap-2 max-w-[600px]">
                  <Controller
                    name="accrualDate"
                    control={control}
                    render={({ field }) => (
                      <CustomDatePicker
                        value={watchSalesDeal ? watchPaymentDate : field.value}
                        disabled={!!watchSalesDeal}
                        onChange={(val) => {
                          if (watchSalesDeal) return
                          field.onChange(val)
                          setValue('confirmAccrual', !isFuture(val))
                        }}
                        placeholder="Выберите дату"
                        format='YYYY-MM-DD'
                        className={cn("w-[180px]!", errors.accrualDate && "border-red-500")}
                      />
                    )}
                  />
                  <Controller
                    name="confirmAccrual"
                    control={control}
                    render={({ field }) => (
                      <OperationCheckbox
                        checked={watchSalesDeal ? false : field.value}
                        disabled={!!watchSalesDeal}
                        label="Подтвердить начисление"
                        onChange={(e) => {
                          if (watchSalesDeal || isFuture(watchAccrualDate)) return
                          field.onChange(e.target.checked)
                        }}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {!showAgent && (
              <div className="flex items-center gap-4">
                <label className="w-[150px] text-xss">Контрагент</label>
                <div className="flex-1 max-w-[600px]">
                  <Controller
                    name="counterparty"
                    control={control}
                    render={({ field }) => (
                      <SingleCounterParty
                        value={field.value}
                        onChange={field.onChange}
                        name='chart_of_accounts_id_2'
                        placeholder='Не выбран.'
                        className='bg-white border rounded-md h-[36px]!'
                        returnChartOfAccount={(val) => setValue('chartOfAccount', val)}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {!showStatya && (
              <div className="flex items-center gap-4">
                <label className="w-[150px] text-xss">Статья</label>
                <div className="flex-1 max-w-[600px]">
                  <Controller
                    name="chartOfAccount"
                    control={control}
                    render={({ field }) => (
                      <SinglSelectStatiya
                        selectedValue={field.value}
                        setSelectedValue={field.onChange}
                        placeholder='Нераспределенный доход'
                        className='bg-white border rounded-md h-[36px]!'
                        type={'Доходы'}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {appStore.isPayment && (
              <div className="flex items-center gap-4">
                <label className="w-[150px] text-xss">Тип платежа</label>
                <div className="flex-1 max-w-[600px]">
                  <Controller
                    name="paymentType"
                    control={control}
                    render={({ field }) => (
                      <SingleSelect
                        data={[
                          { label: 'Наличный', value: 'cash' },
                          { label: 'Карта', value: 'card' },
                          { label: 'Перечисление', value: 'transfer' },
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder='Выберите тип платежа...'
                        withSearch={false}
                        className='bg-white border rounded-md'
                      />
                    )}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="w-[150px] text-xss">Сделка продажи</label>
              <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
                <Controller
                  name="salesDeal"
                  control={control}
                  render={({ field }) => (
                    <SingleZdelka
                      value={field.value}
                      onChange={field.onChange}
                      placeholder='Выберите сделку...'
                      className='bg-white border rounded-md h-[36px]!'
                      hasError={!!errors.salesDeal}
                    />
                  )}
                />
                {errors.salesDeal && <span className="text-xs text-red-500">{errors.salesDeal.message}</span>}
              </div>
            </div>
          </div>

          {/* SECTION: ОПИСАНИЕ */}
          <div className="flex flex-col gap-5 mt-4">
            <div className="flex items-start gap-4">
              <label className="w-[150px] text-xss pt-2">Назначение платежа <span className="text-red-500 ml-0.5">*</span></label>
              <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
                <Controller
                  name="purpose"
                  control={control}
                  rules={{ required: 'Введите назначение платежа' }}
                  render={({ field }) => (
                    <TextArea
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Назначение платежа"
                      rows={3}
                      className={cn("border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F51B9] focus:border-[#0F51B9]")}
                      hasError={!!errors.purpose}
                    />
                  )}
                />
                {errors.purpose && <span className="text-xs text-red-500">{errors.purpose.message}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-t justify-end gap-2 px-3 pt-3 mt-auto bg-white">
          <button type="button" onClick={() => onClose?.()} className="secondary-btn py-2!">Отмена</button>
          <button type="submit" disabled={isPending || !canSubmit} className={cn("primary-btn py-2!", (!canSubmit || isPending) && 'opacity-60 cursor-not-allowed')}>{isPending ? <Loader2 className='animate-spin' /> : 'Сохранить'}</button>
        </div>
      </form>

      {/* <CustomModal
        isOpen={isDateModalOpen}
        onClose={() => {
          setIsDateModalOpen(false)
          setTempSalesDeal(null)
        }}
      >
        <div className='p-4'>
          <h3 className='text-lg font-bold text-neutral-900'>Дата начисления станет равна дате оплаты</h3>
          <p className='text-neutral-600 text-sm py-3'>У оплаты, которую вы собираетесь прикрепить к сделке, дата начисления имеет статус «Подтверждена» или отличается от даты оплаты.</p>
          <p className='text-neutral-600 text-sm pb-6'>После прикреплении такого платежа дата начисления будет равна дате оплаты и получит статус «Не подтверждена».</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button className='secondary-btn' onClick={() => {
              setIsDateModalOpen(false)
              setTempSalesDeal(null)
            }}>
              Отменить
            </button>
            <button className='primary-btn' onClick={() => {
              setValue('salesDeal', tempSalesDeal)
              setValue('accrualDate', watchPaymentDate || watchAccrualDate)
              setValue('confirmAccrual', false)
              setIsDateModalOpen(false)
              setSelectedSplits((prev) => prev.filter(item => item.value !== 'Начисление'))
              setTempSalesDeal(null)
            }}>
              Продолжить
            </button>
          </div>
        </div>
      </CustomModal> */}
    </>
  )
})

export default PaymentForm
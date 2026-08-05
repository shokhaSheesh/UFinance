'use client'
import { cn } from '@/lib/utils'
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
import SelectProjects from '../../../../ReadyComponents/SelectProjects'
import SingleZdelka from '../../../../ReadyComponents/SingleZdelka'
import SinglePurchaseZdelka from '../../../../ReadyComponents/SinglePurchaseZdelka'
import OperationCheckbox from '../../../../shared/Checkbox/operationCheckbox'
import Input from '../../../../shared/Input'
import SingleSelect from '../../../../shared/Selects/SingleSelect'
import TextArea from '../../../../shared/TextArea'
import SplitAmount from '../../SplitAmount'

// Icons
import { Loader2 } from 'lucide-react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { isProjectCompletedError } from '@/lib/api/ucode/errors'
import { showErrorAlert } from '@/lib/utils/notifications'
import { useTranslations } from 'next-intl'
import { CreditIcon, DebitIcon, WarnIcon } from '../../../../../constants/icons'
import { useUcodeRequestMutation } from '../../../../../hooks/useDashboard'
import { queryClient } from '../../../../../lib/queryClient'
import { authStore } from '../../../../../store/auth.store'
import { isPastDate } from '../../../../../utils/formatDate'
import { formatDateParseZone, formatDecimal, formatAmountInput, StringtoNumber } from '../../../../../utils/helpers'
import FormDatepicker from '../../../../shared/DatePicker/form-datepicker'

// Разделы плана счетов, по статьям которых начисление отдельно не ведётся:
// дата начисления и его подтверждение блокируются и следуют за оплатой
const ACCRUAL_LOCK_PARENTS = ['Долгосрочные обязательства', 'Капитал']

// Сделка продажи относится только к выплатам по статьям расходов
const EXPENSE_ROOT = 'Расходы'

// Helper to update find_operations infinite query cache
const updateOperationsCache = (updatedOperation) => {
  queryClient.setQueriesData({ queryKey: ['find_operations'] }, (oldData) => {
    if (!oldData) return oldData

    const operationGuid = updatedOperation.guid || updatedOperation.id
    if (!operationGuid) return oldData

    return {
      ...oldData,
      pages: oldData.pages.map(page => ({
        ...page,
        data: {
          ...page.data,
          data: page.data.data.map(op =>
            (op.guid === operationGuid || op.id === operationGuid)
              ? { ...op, ...updatedOperation }
              : op
          )
        }
      }))
    }
  })
}

// ── Reducer Logic ──────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]

const emptyRow = (preselectedCounterparty = '') => ({
  calculationDate: today,
  isCalculationCommitted: true,
  contrAgentId: preselectedCounterparty,
  operationCategoryId: '',
  projectId: '',
  value: '',
  percent: '',
})

// Суммы в инпутах форматируются пробелами ("11 734") — Number/parseFloat на них ломаются
const toNumber = (v) => Number(String(v ?? '').replace(/\s/g, '')) || 0

function rowsReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const newState = [...state, emptyRow()]
      const count = newState.length
      const totalAmount = toNumber(action.amount)
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
      const totalAmount = toNumber(action.amount)
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
        const numAmount = toNumber(action.amount)
        let percent = ''
        if (numAmount > 0 && action.value !== '') {
          percent = String(Number((toNumber(action.value) / numAmount) * 100).toFixed(2))
          if (percent.endsWith('.00')) percent = parseInt(percent).toString()
        }
        let newState = state.map((row, i) =>
          i === action.index ? { ...row, value: action.value, percent } : row
        )

        if (numAmount > 0) {
          const totalValues = newState.reduce((s, r) => s + toNumber(r.value), 0)
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
        const numAmount = toNumber(action.amount)
        let value = ''
        let calculatedValueStr = ''
        if (numAmount > 0 && action.value !== '') {
          value = String(((toNumber(action.value) / 100) * numAmount).toFixed(2))
          calculatedValueStr = value.endsWith('.00') ? parseInt(value).toString() : value
        }
        let newState = state.map((row, i) =>
          i === action.index ? { ...row, percent: action.value, value: calculatedValueStr } : row
        )

        if (numAmount > 0) {
          const totalPercents = newState.reduce((s, r) => s + (parseFloat(r.percent) || 0), 0)
          if (Math.abs(totalPercents - 100) < 0.01) {
            const totalValues = newState.reduce((s, r) => s + toNumber(r.value), 0)
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
      const totalAmount = toNumber(action.amount)
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
      const totalAmount = toNumber(action?.amount)
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
  onSuccess,
  preselectedCounterparty = null,
  defaultDealGuid = null,
  defaultPurchaseDealGuid = null,
  chart_of_accounts_id = null
}) => {

  const t = useTranslations('Operations.forms')
  const tErrors = useTranslations('Errors')
  const tPay = useTranslations('Operations.paymentTypes')

  // Form State
  const isNew = initialData?.isNew
  const defaultValues = useMemo(() => {
    if (initialData && (!isNew || initialData.isCopy)) {
      const raw = initialData
      const paymentDate = raw.data_operatsii ? formatDateParseZone(raw.data_operatsii) : formatDateParseZone(new Date())
      const accrualDate = raw.data_nachisleniya ? formatDateParseZone(raw.data_nachisleniya) : paymentDate

      return {
        paymentDate,
        confirmPayment: raw.payment_confirmed !== undefined ? raw.payment_confirmed : !!raw.oplata_podtverzhdena,
        accountAndLegalEntity: raw.my_accounts_id || raw.bank_accounts_id || null,
        amount: raw?.operationParts?.length ? (raw?.operationParts?.reduce((acc, part) => acc + part.summa, 0) || 0) : raw?.summa || 0,
        accrualDate,
        confirmAccrual: raw.payment_accrual !== undefined ? raw.payment_accrual : false,
        counterparty: raw.counterparties_id || preselectedCounterparty || null,
        chartOfAccount: raw.chart_of_accounts_id || chart_of_accounts_id || null, // Simplified logic
        paymentType: appStore.isPayment ? 'cash' : null,
        salesDeal: raw.sales_transactions_id || defaultDealGuid || null,
        purchaseDeal: raw.purchase_transactions_id || defaultPurchaseDealGuid || null,
        projects_id: raw?.projects_id || null,
        purpose: raw.opisanie || '',
        currency: raw.currenies_id || raw.currencyId || 'RUB',
      }
    }

    return {
      paymentDate: formatDateParseZone(new Date()),
      confirmPayment: true,
      accountAndLegalEntity: null,
      amount: '',
      accrualDate: formatDateParseZone(new Date()),
      confirmAccrual: true,
      counterparty: preselectedCounterparty || null,
      chartOfAccount: chart_of_accounts_id || null,
      paymentType: appStore.isPayment ? 'cash' : null,
      salesDeal: defaultDealGuid || null,
      purchaseDeal: defaultPurchaseDealGuid || null,
      projects_id: null,
      purpose: '',
      currency: '',
    }
  }, [initialData, isNew, chart_of_accounts_id, preselectedCounterparty, defaultDealGuid, defaultPurchaseDealGuid])

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues
  })

  const { mutateAsync: createOperation, isPending } = useUcodeRequestMutation()


  // Amount Splitting State
  const [rows, dispatch] = useReducer(rowsReducer, [emptyRow(preselectedCounterparty), emptyRow()])
  const [selectedSplits, setSelectedSplits] = useState([])
  const [divivedAmounts, setdivivedAmounts] = useState([])
  const [splitValid, setSplitValid] = useState(true)
  const [title, setTitle] = useState()

  // Initialize splits and rows if editing existing operation
  useEffect(() => {
    if (initialData && (!isNew || initialData.isCopy) && initialData.operationParts?.length > 0) {
      const parts = initialData.operationParts

      const newSplits = []
      if (parts.some(p => p.data_nachisleniya)) newSplits.push({ value: 'Начисление', label: 'Начисление' })
      if (parts.some(p => p.counterparties_id)) newSplits.push({ value: 'Контрагент', label: 'Контрагент' })
      if (parts.some(p => p.chart_of_accounts_id)) newSplits.push({ value: 'Статья', label: 'Статья' })
      if (appStore.projectActive && parts.some(p => p.projects_id)) newSplits.push({ value: 'Проект', label: 'Проект' })
      setSelectedSplits(newSplits)

      const mappedRows = parts.map(p => ({
        guid: p.guid,
        calculationDate: p.data_nachisleniya ? formatDate(p.data_nachisleniya) : today,
        isCalculationCommitted: p.payment_accrual ?? true,
        contrAgentId: p.counterparties_id || '',
        operationCategoryId: p.chart_of_accounts_id || '',
        projectId: p.projects_id || '',
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
  // Проект вынесен в разбиение — общее поле проекта скрываем
  const showProject = appStore.projectActive && has('Проект')

  // Watch values
  const watchAccount = watch('accountAndLegalEntity')
  const watchAmount = watch('amount')
  const watchCurrency = watch('currency')
  const watchSalesDeal = watch('salesDeal')
  const watchPurchaseDeal = watch('purchaseDeal')
  const watchPaymentDate = watch('paymentDate')

  const watchAccrualDate = watch('accrualDate')
  const watchConfirmPayment = watch('confirmPayment')
  const watchConfirmAccrual = watch('confirmAccrual')

  // Разделы выбранной статьи (от корня до неё самой):
  // • «Долгосрочные обязательства» / «Капитал» — начисление приравнивается к
  //   оплате: его поля блокируются, а подтверждение повторяет «Подтвердить оплату»
  // • не «Расходы» — сделка продажи к такой выплате не относится
  const [articleAncestors, setArticleAncestors] = useState([])
  const isAccrualLocked = articleAncestors.some((name) => ACCRUAL_LOCK_PARENTS.includes(name))
  const isExpenseArticle = articleAncestors.includes(EXPENSE_ROOT)
  const salesDealDisabled = articleAncestors.length > 0 && !isExpenseArticle
  const accrualDisabled = !!watchPurchaseDeal || isAccrualLocked

  useEffect(() => {
    if (isAccrualLocked) setValue('confirmAccrual', watchConfirmPayment)
  }, [isAccrualLocked, watchConfirmPayment, setValue])

  // Статья не из расходов — сделка продажи неприменима, ранее выбранную сбрасываем
  useEffect(() => {
    if (salesDealDisabled) setValue('salesDeal', '')
  }, [salesDealDisabled, setValue])

  const currencyTitle = useMemo(() => {
    const guid = watchCurrency || (initialData && (!isNew || initialData.isCopy) ? (initialData.currenies_id || initialData.currencyId) : null)
    if (!guid) return ''
    const selected = toJS(appStore.currencies)?.find(c => c.guid === guid)
    return selected ? `${selected?.kod} ${selected.nazvanie}` : ''
  }, [watchCurrency, initialData, isNew, appStore.currencies])

  // Derived flags
  const isDebit = (!showDate && watchConfirmPayment && !watchConfirmAccrual)
  const isCredit = (!showDate && !watchConfirmPayment && watchConfirmAccrual)

  const onSubmit = async (data) => {
    const payload = {
      tip: ['Выплата'],
      summa: formatDecimal(StringtoNumber(data?.amount)),
      data_operatsii: formatDateParseZone(data?.paymentDate),
      data_nachisleniya: watchPurchaseDeal ? formatDateParseZone(data?.paymentDate) : formatDateParseZone(data?.accrualDate),
      payment_confirmed: data?.confirmPayment,
      payment_accrual: watchPurchaseDeal ? false : data?.confirmAccrual,
      currenies_id: appStore?.currency?.guid,
      my_accounts_id: watchAccount,
      legal_entity_id: authStore?.userData?.legal_entity_id,
      chart_of_accounts_id: chart_of_accounts_id || data?.chartOfAccount,
      sales_transactions_id: watchSalesDeal,
      purchase_transactions_id: watchPurchaseDeal || null,
      // Проект разбит по строкам — на самой операции его не отправляем
      ...(appStore.projectActive ? { projects_id: showProject ? null : (data?.projects_id || null) } : {}),
      counterparties_id: data?.counterparty,
      comment: watch('purpose'),
      currenies_id: data?.currency,
      paymentType: data?.paymentType
    }

    if (divivedAmounts.length > 0) {
      payload.items = divivedAmounts.map(item => ({
        ...(item?.guid ? { guid: item?.guid } : null),
        summa: formatDecimal(StringtoNumber(item?.value)),
        percent: Number(item?.percent),
        data_nachisleniya: watchPurchaseDeal ? moment(data?.paymentDate).format('YYYY-MM-DD') : moment(showDate && !watchSalesDeal ? (item?.calculationDate) : data?.accrualDate).format('YYYY-MM-DD'),
        payment_accrual: watchPurchaseDeal ? false : (showDate && !watchSalesDeal ? item?.isCalculationCommitted : data?.confirmAccrual),
        counterparties_id: showAgent ? (item?.contrAgentId || null) : null,
        chart_of_accounts_id: showStatya ? (item?.operationCategoryId || null) : null,
        ...(appStore.projectActive ? { projects_id: showProject ? (item?.projectId || null) : null } : {}),
      }))
    }

    if (!isNew) {
      payload.guid = initialData.guid
      payload.is_group = divivedAmounts.length > 0 ? true : false
    }

    try {

      const res = await createOperation({
        method: isNew ? 'create_operation' : 'update_operation',
        data: payload
      }, {
        onSuccess: (data) => {
          if (isProjectCompletedError(data)) return
          onClose()
        }
      })
      // Бэк может ответить 200 с телом-ошибкой — тогда onError мутации молчит
      if (isProjectCompletedError(res)) {
        showErrorAlert(tErrors('projectCompleted.title'), tErrors('projectCompleted.text'))
        return
      }

      const operationId = isNew
        ? (res?.data?.data?.guid || res?.data?.data?.[0]?.guid)
        : initialData.guid

      // Update cache with new operation data for immediate UI update
      if (res?.data?.data && !isNew) {
        updateOperationsCache(res.data.data)
      }


      queryClient.refetchQueries({ queryKey: ['list_operations_by_query'] })

      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['operationsList'] })
      queryClient.invalidateQueries({ queryKey: ['operations'] })
      queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
      queryClient.invalidateQueries({ queryKey: ['get_sales_transaction_by_guid'] })
      queryClient.invalidateQueries({ queryKey: ['get_purchase_transaction_by_guid'] })
      queryClient.invalidateQueries({ queryKey: ['myAccountsBoard'] })
      queryClient.invalidateQueries({ queryKey: ['legal_entities'] })
      queryClient.invalidateQueries({ queryKey: ['legalEntitiesPlanFact'] })
      queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })
      queryClient.invalidateQueries({ queryKey: ['balance_report'] })
      await onSuccess?.(operationId)
    } catch (error) {
      console.error('PaymentForm onSubmit error', error)
    }
  }

  const handleSelectMyAccount = (value) => {
    setValue('currency', value)
    const selected = toJS(appStore.currencies)?.find(c => c.guid === value)
    if (selected) {
      setTitle(`${selected?.kod} ${selected.nazvanie}`)
    }
  }

  useEffect(() => {
    if (initialData && (!isNew || initialData.isCopy)) {
      const currencyGuid = initialData.currenies_id || initialData.currencyId
      const currencies = toJS(appStore.currencies)
      if (currencyGuid && currencies?.length) {
        const selected = currencies.find(c => c.guid === currencyGuid)
        if (selected) {
          setTitle(`${selected?.kod} ${selected.nazvanie}`)
        }
      }
    }
  }, [initialData, isNew, appStore.currencies])

  const totalSplitValue = divivedAmounts.reduce((acc, curr) => acc + Number(String(curr.value).replace(/\s/g, '') || 0), 0)
  const amountToNumber = Number(StringtoNumber(watchAmount))
  // Разбиение должно покрывать сумму операции целиком: и перебор, и недобор,
  // и пустая сумма при заполненных строках блокируют сохранение.
  // splitValid приходит из SplitAmount — там же считается и подсветка ошибки
  const isSplitMismatched = divivedAmounts.length > 0 && (amountToNumber <= 0 || Math.abs(totalSplitValue - amountToNumber) >= 0.01)
  const canSubmit = splitValid && !isSplitMismatched

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col h-full overflow-hidden text-slate-900">
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 flex flex-col gap-5">
          {/* SECTION: ОПЛАТА */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <label className="w-[150px] text-xss!">{t('paymentDate')}</label>
              <div className="flex-1 flex gap-2 items-center max-w-[600px]">
                <Controller
                  name="paymentDate"
                  control={control}
                  render={({ field }) => (
                    <FormDatepicker
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val)
                        setValue('confirmPayment', !isFuture(val))
                        if (watchSalesDeal) {
                          setValue('accrualDate', val)
                        }
                      }}
                      placeholder={t('selectDate')}
                      format='YYYY-MM-DD'
                      inputClass={cn("bg-white border", errors.paymentDate && "border-red-500")}
                    />
                  )}
                />
                <span className="flex items-center w-5">{isPastDate(watchPaymentDate) && !watchConfirmPayment && <WarnIcon />}</span>
                <Controller
                  name="confirmPayment"
                  control={control}
                  render={({ field }) => (
                    <OperationCheckbox
                      checked={field.value}
                      label={t('confirmPayment')}
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
              <label className="w-[150px] text-xss">{t('accountAndLegalEntity')} <span className="text-red-500 ml-0.5">*</span></label>
              <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
                <Controller
                  name="accountAndLegalEntity"
                  control={control}
                  rules={{ required: t('selectAccountError') }}
                  render={({ field }) => (
                    <SelectMyAccounts
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val)
                        setTitle('')
                      }}
                      multi={false}
                      type="show"
                      isClearable={false}
                      extraValue="currenies_id"
                      returnValue={handleSelectMyAccount}
                      placeholder={t('legalEntityPlaceholder')}
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
                <label className="min-w-[150px] text-xss mt-2">{t('amount')}</label>
                <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                  <div className="flex items-center gap-3">
                    <Controller
                      name="amount"
                      control={control}
                      render={({ field }) => (
                        <div className='flex items-center gap-2'>
                          <Input
                            type="text"
                            value={formatAmountInput(field.value)}
                            onChange={(e) => field.onChange(formatAmountInput(e.target.value))}
                            placeholder={t('amountPlaceholder')}
                            className={cn("w-[230px]", errors.amount && "border-red-500")}
                          />
                          <span className="flex items-center gap-2">
                            {!watchPurchaseDeal && isDebit && <DebitIcon />}
                            {!watchPurchaseDeal && isCredit && <CreditIcon />}
                          </span>
                        </div>
                      )}
                    />
                    <p className='text-xss text-black font-medium text-end w-full line-clamp-1'>{currencyTitle || title}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <SplitAmount
                      amount={watchAmount}
                      onChange={setdivivedAmounts}
                      rows={rows}
                      modalType={'payment'}
                      dispatch={dispatch}
                      salesDeal={false}
                      confirmAccural={watchConfirmAccrual}
                      confirmPayment={watchConfirmPayment}
                      selectedSplits={selectedSplits}
                      setSelectedSplits={setSelectedSplits}
                      onValidityChange={setSplitValid}
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
              <div className={cn("flex items-center gap-4", accrualDisabled && "opacity-50")}>
                <label className="w-[150px] text-xss!">{t('accrualDate')}</label>
                <div className="flex-1 flex gap-2 items-center max-w-[600px]">
                  <Controller
                    name="accrualDate"
                    control={control}
                    render={({ field }) => (
                      <FormDatepicker
                        value={watchPurchaseDeal ? watchPaymentDate : field.value}
                        disabled={accrualDisabled}
                        onChange={(val) => {
                          if (accrualDisabled) return
                          field.onChange(val)
                          setValue('confirmAccrual', !isFuture(val))
                        }}
                        placeholder={t('selectDate')}
                        format='YYYY-MM-DD'
                        inputClass={cn("bg-white border", errors.accrualDate && "border-red-500")}
                      />
                    )}
                  />
                  <span className="flex items-center w-5">{isPastDate(watchAccrualDate) && !watchConfirmAccrual && !watchPurchaseDeal && <WarnIcon />}</span>
                  <Controller
                    name="confirmAccrual"
                    control={control}
                    render={({ field }) => (
                      <OperationCheckbox
                        checked={watchPurchaseDeal ? false : isAccrualLocked ? watchConfirmPayment : field.value}
                        disabled={accrualDisabled}
                        label={t('confirmAccrual')}
                        onChange={(e) => {
                          if (accrualDisabled || (isFuture(watchAccrualDate) && !appStore.isDonoSchool)) return
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
                <label className="w-[150px] text-xss">{t('counterparty')}</label>
                <div className="flex-1 max-w-[600px]">
                  <Controller
                    name="counterparty"
                    control={control}
                    render={({ field }) => (
                      <SingleCounterParty
                        value={field.value}
                        onChange={field.onChange}
                        name='chart_of_accounts_id_2'
                        placeholder={t('counterpartyPlaceholder')}
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
                <label className="w-[150px] text-xss">{t('statya')}</label>
                <div className="flex-1 max-w-[600px]">
                  <Controller
                    name="chartOfAccount"
                    control={control}
                    render={({ field }) => (
                      <SinglSelectStatiya
                        selectedValue={field.value}
                        setSelectedValue={field.onChange}
                        placeholder={t('statyaPaymentPlaceholder')}
                        className='bg-white border rounded-md h-[36px]!'
                        type={'Доходы'}
                        returnAncestors={setArticleAncestors}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {appStore.isPayment && (
              <div className="flex items-center gap-4">
                <label className="w-[150px] text-xss">{t('paymentType')}</label>
                <div className="flex-1 max-w-[600px]">
                  <Controller
                    name="paymentType"
                    control={control}
                    render={({ field }) => (
                      <SingleSelect
                        data={[
                          { label: tPay('cash'), value: 'cash' },
                          { label: tPay('card'), value: 'card' },
                          { label: tPay('transfer'), value: 'transfer' },
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t('paymentTypePlaceholder')}
                        withSearch={false}
                        isClearable={false}
                        className='bg-white border rounded-md'
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {/* Проект — только если включён модуль проектов и не разбит по строкам */}
            {appStore.projectActive && !showProject && (
              <div className="flex items-center gap-4">
                <label className="w-[150px] text-xss">{t('project')}</label>
                <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
                  <Controller
                    name="projects_id"
                    control={control}
                    render={({ field }) => (
                      <SelectProjects
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t('projectPlaceholder')}
                        className='bg-white border rounded-md h-[36px]!'
                      />
                    )}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="w-[150px] text-xss">{t('purchaseDeal')}</label>
              <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
                <Controller
                  name="purchaseDeal"
                  control={control}
                  render={({ field }) => (
                    <SinglePurchaseZdelka
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('purchaseDealPlaceholder')}
                      className='bg-white border rounded-md h-[36px]!'
                      hasError={!!errors.purchaseDeal}
                    />
                  )}
                />
                {errors.purchaseDeal && <span className="text-xs text-red-500">{errors.purchaseDeal.message}</span>}
              </div>
            </div>

            <div className={cn("flex items-center gap-4", salesDealDisabled && "opacity-50")}>
              <label className="w-[150px] text-xss">{t('salesDeal')}</label>
              <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
                <Controller
                  name="salesDeal"
                  control={control}
                  render={({ field }) => (
                    <SingleZdelka
                      value={salesDealDisabled ? '' : field.value}
                      onChange={field.onChange}
                      placeholder={t('salesDealPlaceholder')}
                      className='bg-white border rounded-md h-[36px]!'
                      hasError={!!errors.salesDeal}
                      defaultDealGuid={defaultDealGuid}
                      disabled={salesDealDisabled}
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
              <label className="w-[150px] text-xss pt-2">{t('purpose')} <span className="text-red-500 ml-0.5">*</span></label>
              <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
                <Controller
                  name="purpose"
                  control={control}
                  rules={{ required: t('purposeRequired') }}
                  render={({ field }) => (
                    <TextArea
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('purposePlaceholder')}
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
          <button type="button" onClick={() => onClose?.()} className="secondary-btn py-2!">{t('cancel')}</button>
          <button type="submit" disabled={isPending || !canSubmit} className={cn("primary-btn py-2!", (!canSubmit || isPending) && 'opacity-60 cursor-not-allowed')}>{isPending ? <Loader2 className='animate-spin' /> : isNew ? t('create') : t('save')}</button>
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
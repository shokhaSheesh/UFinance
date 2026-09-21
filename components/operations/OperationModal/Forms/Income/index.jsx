'use client'
import { cn } from '@/lib/utils'
import { useEffect, useMemo, useReducer, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { appStore } from '../../../../../store/app.store'

// Hooks
import { } from '@/hooks/useDashboard'

// Helpers
import { formatDate, isFuture } from '@/utils/formatDate'
import { refreshOperationsListAfterSave } from '@/utils/operationsCache'

// Components
import SelectMyAccounts from '../../../../ReadyComponents/SelectMyAccounts'
import SingleCounterParty from '../../../../ReadyComponents/SingleCounterParty'
import SelectProjects from '../../../../ReadyComponents/SelectProjects'
import SinglSelectStatiya from '../../../../ReadyComponents/SingleSelectStatiya'
import SingleZdelka from '../../../../ReadyComponents/SingleZdelka'
import OperationCheckbox from '../../../../shared/Checkbox/operationCheckbox'
import Input from '../../../../shared/Input'
import SingleSelect from '../../../../shared/Selects/SingleSelect'
import TextArea from '../../../../shared/TextArea'
import SplitAmount from '../../SplitAmount'

// Icons
import { queryClient } from '@/lib/queryClient'
import { Loader2 } from 'lucide-react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { isProjectCompletedError } from '@/lib/api/ucode/errors'
import { showErrorAlert } from '@/lib/utils/notifications'
import { useTranslations } from 'next-intl'
import { CreditIcon, DebitIcon, WarnIcon } from '../../../../../constants/icons'
import { useDataEditingRestriction } from '../../../../../hooks/useDataEditingRestriction'
import { useUcodeRequestMutation } from '../../../../../hooks/useDashboard'
import { authStore } from '../../../../../store/auth.store'
import { isPastDate } from '../../../../../utils/formatDate'
import { formatDateParseZone, formatDecimal, formatAmountInput, StringtoNumber } from '../../../../../utils/helpers'
import FormDatepicker from '../../../../shared/DatePicker/form-datepicker'

// Разделы плана счетов, по статьям которых начисление отдельно не ведётся:
// дата начисления и его подтверждение блокируются и следуют за оплатой
const ACCRUAL_LOCK_PARENTS = ['Долгосрочные обязательства', 'Капитал']

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

const IncomeForm = observer(({
  initialData,
  onClose,
  onSuccess,
  preselectedCounterparty = null,
  defaultDealGuid = null,
  chart_of_accounts_id = null,
  currentPage
}) => {

  const t = useTranslations('Operations.forms')
  const tErrors = useTranslations('Errors')
  const tPay = useTranslations('Operations.paymentTypes')


  // Form State
  const isNew = initialData?.isNew
  // «Сделать поле «Назначение платежа» необязательным»
  // (is_payment_purpose_optional из get_general_settings): снимает
  // обязательность поля и звёздочку с подписи
  const isPurposeRequired = !appStore.interfaceSettings?.isPaymentPurposeOptional

  // «Показывать поле «Дата начисления» при добавлении операции»
  // (show_accrual_date_on_create). Выключено — блок начисления свёрнут в ссылку
  // «Добавить начисление», как в ПланФакте. У существующей операции блок
  // показываем всегда: иначе уже введённое начисление стало бы недоступно.
  const [accrualExpanded, setAccrualExpanded] = useState(false)
  const isAccrualBlockVisible =
    !isNew ||
    Boolean(appStore.interfaceSettings?.showAccrualDateOnCreate) ||
    accrualExpanded
  // Свернуть блок обратно можно, только если его раскрыли вручную: у существующей
  // операции и при включённой настройке он обязателен и ссылку «Закрыть» не показываем
  const canCollapseAccrual =
    isNew && accrualExpanded && !appStore.interfaceSettings?.showAccrualDateOnCreate
  const defaultValues = useMemo(() => {
    if (initialData && (!isNew || initialData.isCopy)) {
      const raw = initialData
      const paymentDate = raw.data_operatsii ? formatDateParseZone(raw.data_operatsii) : formatDateParseZone(formatDateParseZone(new Date()))
      const accrualDate = raw?.sales_transactions_id && appStore.isAccrualDate ? formatDateParseZone(raw.data_nachisleniya) : paymentDate


      return {
        paymentDate,
        confirmPayment: raw?.payment_confirmed !== undefined ? raw?.payment_confirmed : !!raw?.oplata_podtverzhdena,
        accountAndLegalEntity: raw?.my_accounts_id || raw?.bank_accounts_id || null,
        amount: raw?.operationParts?.length ? (raw?.operationParts?.reduce((acc, part) => acc + part.summa, 0) || 0) : raw?.summa || 0,
        accrualDate,
        confirmAccrual: raw?.payment_accrual !== undefined ? raw?.payment_accrual : false,
        counterparty: raw?.counterparties_id || preselectedCounterparty || null,
        chartOfAccount: raw?.chart_of_accounts_id || chart_of_accounts_id || null, // Simplified logic
        paymentType: appStore.isPayment ? 'cash' : null,
        salesDeal: raw?.sales_transactions_id || defaultDealGuid || null,
        projects_id: raw?.projects_id || null,
        purpose: raw?.opisanie || '',
        currency: raw?.currenies_id || raw?.currencyId || null,
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
      projects_id: null,
      purpose: '',
      currency: null,
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

  // Закрытый период роли: даты раньше minDate недоступны для выбора
  const { minDate, ensureAllowed } = useDataEditingRestriction()

  // Watch values
  const watchAccount = watch('accountAndLegalEntity')
  const watchAmount = watch('amount')
  const watchCurrency = watch('currency')
  const watchSalesDeal = !appStore.isAccrualDate && !appStore.isDonoSchool ? watch('salesDeal') : '' // never delete that is importatn variable
  const watchPaymentDate = watch('paymentDate')
  const watchAccrualDate = watch('accrualDate')
  const watchConfirmPayment = watch('confirmPayment')
  const watchConfirmAccrual = watch('confirmAccrual')
  const saleDeal = watch('salesDeal')

  // Статья из «Долгосрочных обязательств» или «Капитала»: начисление приравнивается
  // к оплате — поля начисления блокируются, подтверждение повторяет «Подтвердить оплату»
  const [isAccrualLocked, setIsAccrualLocked] = useState(false)
  const accrualDisabled = !!watchSalesDeal || isAccrualLocked

  // «Закрыть» сворачивает блок и возвращает начисление к состоянию «не заполняли»,
  // чтобы скрытые значения не ушли в запрос
  const handleCollapseAccrual = () => {
    setAccrualExpanded(false)
    setValue('accrualDate', watchPaymentDate)
    setValue('confirmAccrual', true)
  }

  useEffect(() => {
    if (isAccrualLocked) setValue('confirmAccrual', watchConfirmPayment)
  }, [isAccrualLocked, watchConfirmPayment, setValue])

  const currencyTitle = useMemo(() => {
    const guid = watchCurrency || (initialData && (!isNew || initialData.isCopy) ? (initialData.currenies_id || initialData.currencyId) : null)
    if (!guid) return ''
    const selected = toJS(appStore.currencies)?.find(c => c.guid === guid)
    return selected ? `${selected?.kod} ${selected.nazvanie}` : ''
  }, [watchCurrency, initialData, isNew, appStore.currencies])


  // Derived flags
  const isDebit = (!showDate && !watchConfirmPayment && watchConfirmAccrual && !saleDeal)
  const isCredit = (!showDate && watchConfirmPayment && !watchConfirmAccrual && !saleDeal)

  const onSubmit = async (data) => {

    const dataOplata = moment(data?.paymentDate).format('YYYY-MM-DD')
    const dataNachisleniya = watchSalesDeal ? dataOplata : moment(data?.accrualDate).format('YYYY-MM-DD')

    // Закрытый период роли — см. hooks/useDataEditingRestriction.js
    if (!ensureAllowed([dataOplata, dataNachisleniya])) return

    const payload = {
      tip: ['Поступление'],
      summa: formatDecimal(StringtoNumber(data?.amount)),
      data_operatsii: dataOplata,
      data_nachisleniya: dataNachisleniya,
      payment_confirmed: data?.confirmPayment,
      payment_accrual: watchSalesDeal ? false : data?.confirmAccrual,
      currenies_id: appStore?.currency?.guid,
      my_accounts_id: watchAccount,
      legal_entity_id: authStore?.userData?.legal_entity_id,
      chart_of_accounts_id: chart_of_accounts_id || data?.chartOfAccount,
      sales_transactions_id: saleDeal,
      counterparties_id: data?.counterparty,
      comment: watch('purpose'),
      currenies_id: data?.currency,
      paymentType: data?.paymentType,
      // Проект разбит по строкам — на самой операции его не отправляем
      ...(appStore.projectActive ? { projects_id: showProject ? null : (data?.projects_id || null) } : {}),
    }

    if (divivedAmounts.length > 0) {
      payload.items = divivedAmounts.map(item => ({
        ...(item?.guid && { guid: item?.guid }),
        summa: formatDecimal(StringtoNumber(item?.value)),
        percent: Number(item?.percent),
        data_nachisleniya: showDate && !watchSalesDeal ? (item?.calculationDate || null) : null,
        payment_accrual: showDate && !watchSalesDeal ? (item?.isCalculationCommitted ?? false) : false,
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
      await refreshOperationsListAfterSave({ guid: operationId, newDate: payload.data_operatsii, isNew })
      queryClient.invalidateQueries({ queryKey: ['get_counterparties'] })
      queryClient.invalidateQueries({ queryKey: ['get_counterpaties_total'] })
      queryClient.invalidateQueries({ queryKey: ['legal_entities'] })
      queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })
      queryClient.invalidateQueries({ queryKey: ['balance_report'] })
      await onSuccess?.(operationId)
    } catch (error) {
      console.error('IncomeForm onSubmit error', error)
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-6 flex flex-col gap-6">
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
                      minDate={minDate}
                      inputClass={cn("bg-white border", errors.paymentDate && "border-red-500")}
                    />
                  )}
                />
                <span className="flex items-center w-5">{isPastDate(watchPaymentDate) && !watchConfirmPayment && (!watchSalesDeal) && <WarnIcon />}</span>
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
                      active
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
                            {isDebit && <DebitIcon />}
                            {isCredit && <CreditIcon />}
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
                      modalType={'income'}
                      dispatch={dispatch}
                      salesDeal={watchSalesDeal && !appStore.isDonoSchool}
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

            {/* Ссылка выровнена по колонке полей — как «Разбить сумму» под суммой */}
            {!showDate && !isAccrualBlockVisible && (
              <div className="flex items-center gap-4">
                <span className="w-[150px] shrink-0" />
                <button
                  type="button"
                  onClick={() => setAccrualExpanded(true)}
                  className="text-xss text-primary hover:underline cursor-pointer w-fit"
                >
                  {t('addAccrual')}
                </button>
              </div>
            )}

            {!showDate && isAccrualBlockVisible && (
              <div className="flex flex-col gap-2">
                <div className={cn("flex items-center gap-4", accrualDisabled && "opacity-50")}>
                  <label className="w-[150px] text-xss!">{t('accrualDate')}</label>
                  <div className="flex-1 flex gap-2 items-center max-w-[600px]">
                    <Controller
                      name="accrualDate"
                      control={control}
                      render={({ field }) => (
                        <FormDatepicker
                          value={watchSalesDeal ? watchPaymentDate : field.value}
                          disabled={accrualDisabled}
                          onChange={(val) => {
                            if (accrualDisabled) return
                            field.onChange(val)
                            if (appStore.isDonoSchool) {
                              // setValue('confirmAccrual', !isFuture(val))
                            } else {
                              setValue('confirmAccrual', !isFuture(val))
                            }
                          }}
                          placeholder={t('selectDate')}
                          format='YYYY-MM-DD'
                          minDate={minDate}
                          inputClass={cn("bg-white border", errors.accrualDate && "border-red-500")}
                        />
                      )}
                    />
                    <span className="flex items-center w-5">{isPastDate(watchAccrualDate) && (!watchConfirmAccrual) && (!watchSalesDeal) && <WarnIcon />}</span>
                    <Controller
                      name="confirmAccrual"
                      control={control}
                      render={({ field }) => (
                        <OperationCheckbox
                          checked={watchSalesDeal ? false : isAccrualLocked ? watchConfirmPayment : field.value}
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
              {canCollapseAccrual && (
                <div className="flex items-center gap-4">
                  <span className="w-[150px] shrink-0" />
                  <button
                    type="button"
                    onClick={handleCollapseAccrual}
                    className="text-xss text-primary hover:underline cursor-pointer w-fit"
                  >
                    {t('hideAccrual')}
                  </button>
                </div>
              )}
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
                        name='chart_of_accounts_id'
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
                        placeholder={t('statyaIncomePlaceholder')}
                        className='bg-white border rounded-md h-[36px]!'
                        type={'Расходы'}
                        parent={ACCRUAL_LOCK_PARENTS}
                        returnIsChild={setIsAccrualLocked}
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
              <label className="w-[150px] text-xss">{t('salesDeal')}</label>
              <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
                <Controller
                  name="salesDeal"
                  control={control}
                  render={({ field }) => (
                    <SingleZdelka
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('salesDealPlaceholder')}
                      className='bg-white border rounded-md h-[36px]!'
                      hasError={!!errors.salesDeal}
                      defaultDealGuid={defaultDealGuid}
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
              <label className="w-[150px] text-xss pt-2">
                {t('purpose')}
                {isPurposeRequired && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
                <Controller
                  name="purpose"
                  control={control}
                  rules={isPurposeRequired ? { required: t('purposeRequired') } : undefined}
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

        <div className="flex shrink-0 border-t border-slate-200 justify-end gap-2 px-8 py-4 mt-auto bg-white">
          <button type="button" onClick={() => onClose?.()} className="secondary-btn py-2!">{t('cancel')}</button>
          <button type="submit" disabled={isPending || !canSubmit} className={cn("primary-btn py-2!", (!canSubmit || isPending) && 'opacity-60 cursor-not-allowed')}>{isPending ? <Loader2 className='animate-spin' /> : isNew ? t('create') : t('save')}</button>
        </div>
      </form>
    </>
  )
})

export default IncomeForm
'use client'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import Input from '@/components/shared/Input'
import TextArea from '@/components/shared/TextArea'
import { memo, useMemo, useState } from 'react'
import { Controller, useForm, } from 'react-hook-form'

import { cn } from '@/app/lib/utils'
import { formatDate } from '@/utils/formatDate'
import { Loader2 } from 'lucide-react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import { WarnIcon } from '../../../../../constants/icons'
import { useUcodeRequestMutation } from '../../../../../hooks/useDashboard'
import { queryClient } from '../../../../../lib/queryClient'
import { appStore } from '../../../../../store/app.store'
import { isFuture, isPastDate } from '../../../../../utils/formatDate'
import { formatDecimal, formatNumber, getCurrencyIcon, StringtoNumber } from '../../../../../utils/helpers'
import MyAccountCurrensies from '../../../../ReadyComponents/MyAccountCurrensies'
import SelectLegelEntitties from '../../../../ReadyComponents/SelectLegelEntitties'
import SinglSelectStatiya from '../../../../ReadyComponents/SingleSelectStatiya'
import SingleZdelka from '../../../../ReadyComponents/SingleZdelka'
import FormDatepicker from '../../../../shared/DatePicker/form-datepicker'

const AccuralForm = observer(({ onCancel, onClose, onSuccess, initialData }) => {
  const [isFromRasxodChild, setIsFromRasxodChild] = useState(false)
  const [isToRasxodChild, setIsToRasxodChild] = useState(false)
  const [title, setTitle] = useState()

  const isNew = initialData?.isNew
  const defaultCurrency = toJS(appStore.currencies).find(c => c.guid === appStore.currency.guid)


  const defaultValues = useMemo(() => {
    if (initialData && (!isNew || initialData.isCopy)) {
      const raw = initialData
      return {
        accuralDate: raw.data_operatsii ? formatDate(raw.data_operatsii) : formatDate(new Date()),
        confirmAccrual: raw.payment_accrual,
        legalEntity: raw.legal_entity_id || '',
        chartOfAccountWriteOff: raw.chart_of_accounts_id || null,
        summa: raw.summa !== undefined && raw.summa !== null ? Math.abs(Number(raw.summa)) : (raw.rawData?.summa !== undefined && raw.rawData?.summa !== null ? Math.abs(Number(raw.rawData.summa)) : 0),
        canAllowOpiu: raw.include_in_profit_and_loss_cash_method !== undefined ? raw.include_in_profit_and_loss_cash_method : true,
        chartOfAccountEnrollment: raw.chart_of_accounts_id_2 || null,
        sellingDealId: raw.sales_transactions_id || '',
        sellingDealId2: raw.sales_transactions_id_2 || '',
        comment: raw.opisanie || '',
        counterpary_id: raw.counterparties_id || '',
        repeatEvery: raw.repeat_every || null,
        repeatUnit: raw.repeat_unit || null,
        repeatUntil: raw.repeat_until || null,
        repeatCount: raw.repeat_count || null,
        currency: raw.currencyId || '',
      }
    }

    return {
      accuralDate: formatDate(new Date()),
      confirmAccrual: true,
      legalEntity: '',
      chartOfAccountWriteOff: null,
      summa: '',
      canAllowOpiu: true,
      chartOfAccountEnrollment: null,
      sellingDealId: '',
      sellingDealId2: '',
      comment: '',
      counterpary_id: '',
      repeatEvery: null,
      repeatUnit: null,
      repeatUntil: null,
      repeatCount: null,
      currency: null,
    }
  }, [initialData, isNew])



  const { getValues, control, handleSubmit, setValue, watch, formState: { errors, } } = useForm({
    defaultValues
  })

  const { mutateAsync: createAccural, isPending } = useUcodeRequestMutation({
    mutationSetting: {}
  })


  const handleSelect = (value) => {
    setValue('legalEntity', value, { shouldValidate: true })
    const selected = getCurrencyIcon(currency)
    if (selected) {
      setTitle(`${selected.kod} ${selected.nazvanie}`)
    } else {
      setTitle(`${defaultCurrency.kod} ${defaultCurrency.nazvanie}`)
    }
  }



  const legalEntityGuid = watch('legalEntity')
  const watchAccuralDate = watch('accuralDate')
  const watchConfirmAccrual = watch('confirmAccrual')
  const currency = watch('currency')
  const currencyTitle = legalEntityGuid ? title : ``

  const onSubmit = async (data) => {
    try {
      const requestData = {
        tip: ['Начисление'],
        data_operatsii: data.accuralDate,
        payment_accural: data.confirmAccrual,
        legal_entity_id: data.legalEntity,
        chart_of_accounts_id: data.chartOfAccountWriteOff,
        chart_of_accounts_id_2: data.chartOfAccountEnrollment,
        sales_transactions_id: data.sellingDealId || null,
        sales_transactions_id_2: data.sellingDealId2 || null,
        // counterparties_id: data.counterpary_id,
        include_in_profit_and_loss_cash_method: data.canAllowOpiu,
        repeat_enabled: data.repeatEnabled,
        repeat_every: data.repeatEvery,
        repeat_unit: data.repeatUnit,
        repeat_until: data.repeatUntil,
        repeat_count: data.repeatCount,
        comment: data.comment,
        summa: formatDecimal(StringtoNumber(data.summa)) || '',
        currenies_id: data.currency || appStore.currency.guid,
      }

      if (!isNew) {
        requestData.guid = initialData.guid
      }

      const res = await createAccural({
        method: isNew ? 'create_operation' : 'update_operation',
        data: requestData
      }, {
        onSuccess: () => {
          onClose()
        }
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
      queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })
      queryClient.invalidateQueries({ queryKey: ['balance_report'] })
      const operationId = isNew
        ? (res?.data?.data?.guid || res?.data?.data?.[0]?.guid)
        : initialData.guid
      await onSuccess?.(operationId)
    } catch (error) {
      console.error('Error in AccuralForm handleSubmit:', error)
    }
  }
  const handleSelectCurrency = (value) => {
    setValue('currency', value)
    const selected = getCurrencyIcon(value)
    if (selected) {
      setTitle(`${selected.kod} ${selected.nazvanie}`)
    } else {
      setTitle(`${defaultCurrency.kod} ${defaultCurrency.nazvanie}`)
    }
  }




  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col h-full overflow-hidden text-slate-900">
      <div className="flex-1 overflow-y-auto  py-4 flex flex-col gap-5">
        {/* SECTION: ОТКУДА */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-px bg-gray-200"></div>
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase whitespace-nowrap tracking-wider">Дебит</h3>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Дата начисления */}
          <div className="flex items-center gap-4">
            <label className="w-[150px] text-xss!">Дата начисления</label>
            <div className="flex-1 flex  gap-2 max-w-[600px]">
              <Controller
                name="accuralDate"
                control={control}
                render={({ field }) => (
                  <FormDatepicker
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val)
                      setValue('confirmAccrual', !isFuture(val))
                    }}
                    placeholder="Выберите дату"
                    format='YYYY-MM-DD'
                    inputClass={cn("bg-white border", errors.accuralDate && "border-red-500")}
                  />
                )}
              />
              {/* Подтвердить начисление */}
              <span className="flex items-center w-5">{isPastDate(watchAccuralDate) && !watchConfirmAccrual && <WarnIcon />}</span>
              <Controller
                name="confirmAccrual"
                control={control}
                render={({ field }) => (
                  <OperationCheckbox
                    checked={field.value}
                    label="Подтвердить начисление"
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            </div>
          </div>

          {/* Юрлицо */}
          <div className="flex items-center gap-4">
            <label className="w-[150px] text-[13px]">Юрлицо <span className="text-red-500 ml-0.5">*</span></label>
            <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
              <Controller
                name="legalEntity"
                control={control}
                rules={{ required: 'Выберите юрлицо' }}
                render={({ field }) => (
                  <SelectLegelEntitties
                    value={field.value}
                    onChange={handleSelect}
                    multi={false}
                    childFieldName={'currenies_id'}
                    returnFieldValue={(value) => {
                      if (value) {
                        setValue('currency', value)
                      } else {
                        setValue('currency', '')
                      }
                    }}
                    isClearable={false}
                    placeholder="Выберите юрлицо..."
                    className="bg-white border rounded-md flex-1 h-[36px]!"
                    hasError={errors.legalEntity}
                  />
                )}
              />
              {errors.legalEntity && <span className="text-xs text-red-500">{errors.legalEntity.message}</span>}
            </div>
            <div className={'w-40'} >
              <Controller
                name="currency"
                control={control}
                rules={{ required: 'Выберите валюту' }}
                render={({ field }) => (
                  <MyAccountCurrensies isClearable={false} guid={legalEntityGuid} value={field.value} onChange={field.onChange} className="w-40 bg-white " wrapperClassName={'w-40'} />
                )}
              />
              {errors.currency && watch('legalEntity') && <span className="text-xs text-red-500">{errors.currency.message}</span>}
            </div>
          </div>

          {/* Статья списания */}
          <div className="flex items-center gap-4">
            <label className="w-[150px] text-[13px]">Статья по дебету <span className="text-red-500 ml-0.5">*</span></label>
            <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
              <Controller
                name="chartOfAccountWriteOff"
                control={control}
                rules={{ required: 'Выберите статью по дебету' }}
                render={({ field }) => (
                  <SinglSelectStatiya
                    selectedValue={field.value}
                    setSelectedValue={field.onChange}
                    placeholder="Выберите статью по дебету..."
                    className="flex-1 bg-white border rounded-md"
                    type="Доходы"
                    parent="Расходы"
                    isClearable={false}
                    returnIsChild={setIsFromRasxodChild}
                    hasError={errors.chartOfAccountWriteOff}
                  />
                )}
              />
              {errors.chartOfAccountWriteOff && <span className="text-xs text-red-500">{errors.chartOfAccountWriteOff.message}</span>}
            </div>
          </div>

          {isFromRasxodChild && <div className="flex items-center gap-4">
            <label className="w-[150px] text-[13px]">Сделка продажи</label>
            <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
              <Controller
                name="sellingDealId"
                control={control}
                render={({ field }) => (
                  <SingleZdelka
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Выберите сделку продажи..."
                    className="flex-1 bg-white border rounded-md"
                    withSearch={false}
                  />
                )}
              />
            </div>
          </div>}

          {/* Сумма */}
          <div className="flex items-center gap-4">
            <label className="w-[150px] text-[13px]">Сумма</label>
            <div className="flex-1 flex gap-1 max-w-[600px]">
              <div className="flex items-center gap-3">
                <Controller
                  name="summa"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      value={formatNumber(field.value)}
                      onChange={(e) => field.onChange(formatNumber(e.target.value))}
                      placeholder="0"
                      className={cn("w-[200px]", errors.summa && "border-red-500")}
                    />
                  )}
                />
              </div>
              <p className='text-sm text-neutral-600 mt-2 font-bold text-end w-full'>{currencyTitle}</p>
            </div>
          </div>

          {/* Учитывать в ОПиУ кассовым методом */}
          <div className="flex items-center gap-4">
            <div className="w-[150px]"></div>
            <Controller
              name="canAllowOpiu"
              control={control}
              render={({ field }) => (
                <OperationCheckbox
                  checked={field.value}
                  label="Учитывать в ОПиУ кассовым методом"
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </div>
        </div>

        {/* SECTION: ------------- КУДА ---------------- */}
        <div className="flex flex-col gap-5 mt-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-px bg-gray-200"></div>
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase whitespace-nowrap tracking-wider">Кредит</h3>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Статья зачисления */}
          <div className="flex items-center gap-4">
            <label className="w-[150px] text-xss!">Статья по кредиту <span className="text-red-500 ml-0.5">*</span></label>
            <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
              <Controller
                name="chartOfAccountEnrollment"
                control={control}
                rules={{ required: 'Выберите статью по кредиту' }}
                render={({ field }) => (
                  <SinglSelectStatiya
                    selectedValue={field.value}
                    setSelectedValue={field.onChange}
                    placeholder="Выберите статью по кредиту..."
                    className="flex-1 bg-white border rounded-md"
                    type=""
                    isClearable={false}
                    parent="Расходы"
                    returnIsChild={setIsToRasxodChild}
                    hiddenValue={getValues("chartOfAccountWriteOff")}
                    hasError={errors.chartOfAccountEnrollment}
                  />
                )}
              />
              {errors.chartOfAccountEnrollment && <span className="text-xs text-red-500">{errors.chartOfAccountEnrollment.message}</span>}
            </div>
          </div>
          {isToRasxodChild && <div className="flex items-center gap-4">
            <label className="w-[150px] text-xss!">Сделка продажи</label>
            <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
              <Controller
                name="sellingDealId2"
                control={control}
                render={({ field }) => (
                  <SingleZdelka
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Выберите сделку продажи..."
                    className="flex-1 bg-white border rounded-md"
                    withSearch={false}
                  />
                )}
              />
            </div>
          </div>}

          {/* {isToRasxodChild && <div className="flex items-center gap-4">
            <label className="w-[150px] text-xss">Контрагент</label>
            <div className="flex-1 max-w-[600px]">
              <Controller
                name="counterparty_id"
                control={control}
                render={({ field }) => (
                  <SingleCounterParty
                    value={field.value}
                    onChange={field.onChange}
                    placeholder='Не выбран.'
                    className='bg-white border rounded-md'
                  />
                )}
              />
            </div>
          </div>} */}

          {/* Назначение */}
          <div className="flex items-start gap-4">
            <label className="w-[150px] text-[13px] pt-2">Назначение <span className="text-red-500 ml-0.5">*</span></label>
            <div className="flex-1 flex flex-col gap-1 max-w-[600px]">
              <Controller
                name="comment"
                control={control}
                rules={{ required: 'Введите назначение' }}
                render={({ field }) => (
                  <TextArea
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Назначение платежа"
                    rows={3}
                    className={cn("border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F51B9] focus:border-[#0F51B9]")}
                    hasError={!!errors.comment}
                  />
                )}
              />
              {errors.comment && <span className="text-xs text-red-500">{errors.comment.message}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex border-t justify-end gap-2 px-3 pt-3 mt-auto bg-white">
        <button type="button" onClick={onCancel} className="secondary-btn py-2!">Отмена</button>
        <button type="submit" className="primary-btn py-2!">{isPending ? <Loader2 className='animate-spin' /> : isNew ? 'Создать' : 'Сохранить'}</button>
      </div>
    </form>
  )
})

export default memo(AccuralForm)
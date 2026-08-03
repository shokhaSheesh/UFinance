"use client"

import SelectAccountGroups from '@/components/ReadyComponents/SelectAccountGroups'
import Input from '@/components/shared/Input'
import { useCreateMyAccount, useUpdateMyAccount } from '@/hooks/useDashboard'
import { cn } from '@/lib/utils'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { queryClient } from '../../../lib/queryClient'
import { appStore } from '../../../store/app.store'
import { formatAmountInput, formatDecimal, StringtoNumber } from '../../../utils/helpers'
import SelectLegelEntitties from '../../ReadyComponents/SelectLegelEntitties'
import CustomDialog from '../../shared/CustomDialog'
import FormDatepicker from '../../shared/DatePicker/form-datepicker'
import Loader from '../../shared/Loader'
import SingleSelect from '../../shared/Selects/SingleSelect'

export default function CreateMyAccountModal({ isOpen, onClose, account = null }) {
  const t = useTranslations('Directories.account')
  const tc = useTranslations('Common')
  const createMutation = useCreateMyAccount()
  const updateMutation = useUpdateMyAccount()
  const isEdit = !!account && !!account.guid

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const defaultValues = useMemo(() => {
    if (isEdit && account) {
      return {
        nazvanie: account.nazvanie || '',
        tip: Array.isArray(account.tip) ? account.tip : ['Наличный'],
        nachalьnyy_ostatok: account?.nachalьnyy_ostatok_val || '',
        data_sozdaniya: moment.parseZone(account?.data_sozdaniya || Date.now()).format('YYYY-MM-DD'),
        currenies_id: account.currenies_id || '',
        komentariy: account.komentariy || '',
        legal_entity_id: account.legal_entity_id || '',
        bik: account.bik || '',
        bank: account.bank_name || account.bank || '',
        rasch_schet: account.nomer_scheta || '',
        korr_schet: account.kor_schet || account.korr_schet || '',
        nomer: account.nomer || '',
        account_group_id: account.account_groups_id || account.account_group_id || account.group_id || ''
      }
    }
    return {
      nazvanie: '',
      tip: ['Наличный'],
      nachalьnyy_ostatok: '',
      data_sozdaniya: moment.parseZone(Date.now()).format('YYYY-MM-DD'),
      currenies_id: appStore?.currency?.guid || '',
      komentariy: '',
      legal_entity_id: '',
      bik: '',
      bank: '',
      rasch_schet: '',
      korr_schet: '',
      nomer: '',
      account_group_id: ''
    }
  }, [isEdit, account])

  const { control, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues
  })

  const formData = watch()
  const selectedType = formData.tip?.[0] || ''



  // Transform currencies data
  const currencies = useMemo(() => {
    return appStore.currencies.map(item => ({
      value: item.guid,
      label: `${item?.kod || ''} (${item.nazvanie || ''})`.trim(),
      kod: item?.kod || '',
      nazvanie: item.nazvanie || ''
    }))
  }, [])


  // Account types
  const accountTypes = [
    { value: 'Наличный', label: t('types.cash') },
    { value: 'Безналичный', label: t('types.nonCash') },
    { value: 'Карта физлица', label: t('types.card') },
    { value: 'Электронный', label: t('types.electronic') }
  ]

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
      reset(defaultValues)
      if (isEdit && account && (account.bik || account.bank || account.rasch_schet || account.korr_schet)) {
        setShowDetails(true)
      } else {
        setShowDetails(false)
      }
    } else {
      setIsVisible(false)
    }
  }, [isOpen, account, isEdit, reset, defaultValues])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 250)
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const submitData = {
        nazvanie: data.nazvanie.trim(),
        tip: data.tip,
        nachalьnyy_ostatok: data.nachalьnyy_ostatok ? formatDecimal(StringtoNumber(data.nachalьnyy_ostatok)) : null,
        data_sozdaniya: data.data_sozdaniya || null,
        currenies_id: data.currenies_id || null,
        komentariy: data.komentariy || null,
        legal_entity_id: data.legal_entity_id || null,
        bik: data.bik || null,
        bank_name: data.bank || null,
        nomer: data.nomer,
        nomer_scheta: data.rasch_schet,
        kor_schet: data.korr_schet || null,
        account_groups_id: data.account_group_id || null,
      }

      if (isEdit && account && account.guid) {
        submitData.guid = account.guid
        await updateMutation.mutateAsync(submitData)
      } else {
        await createMutation.mutateAsync(submitData)
      }

      queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })
      queryClient.invalidateQueries({ queryKey: ['myAccountsBoard'] })

      handleClose()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isVisible && !isOpen) return null

  return (
    <CustomDialog className="" open={isOpen} onClose={handleClose}>
      <div className="flex w-[600px]! flex-col h-full text-slate-900">
        <div className="border-b pb-3 mb-3 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{isEdit ? t('editTitle') : t('createTitle')}</h2>
        </div>

        <div className="px-4 overflow-y-auto max-h-[70vh] py-4">
          <div className="flex flex-col gap-3">
            {/* Название */}
            <div className="flex flex-row gap-2">
              <label className="w-[30%] text-sm  text-[#0f172a] flex items-center gap-1">
                {t('fields.name')} <span className="text-red-500">*</span>
              </label>
              <div className="flex-1 flex flex-col gap-1">
                <Controller
                  name="nazvanie"
                  control={control}
                  rules={{ required: t('errors.nameRequired') }}
                  render={({ field }) => (
                    <Input
                      type="text"
                      {...field}
                      placeholder={t('placeholders.name')}
                      className={cn(errors.nazvanie && "border-red-500")}
                    />
                  )}
                />
                {errors.nazvanie && (
                  <div className="text-[12px] text-red-500 mt-1">{errors.nazvanie.message}</div>
                )}
              </div>
            </div>


            {/* Группа */}
            <div className="flex flex-row gap-2">
              <label className="w-[30%] text-sm text-[#0f172a] flex items-center gap-1">
                {t('fields.group')}
              </label>
              <div className="flex-1 flex flex-col gap-1">
                <Controller
                  name="account_group_id"
                  control={control}
                  render={({ field }) => (
                    <SelectAccountGroups
                      value={field.value}
                      onChange={field.onChange}
                      className="bg-white"
                    />
                  )}
                />
              </div>
            </div>

            {/* Юрлицо */}
            <div className="flex flex-row gap-2">
              <label className="w-[30%] text-sm  text-[#0f172a] flex items-center gap-1">{t('fields.legalEntity')} <span className="text-red-500">*</span></label>
              <div className="flex-1 flex flex-col gap-1">
                <Controller
                  name="legal_entity_id"
                  control={control}
                  rules={{ required: t('errors.legalEntityRequired') }}
                  render={({ field }) => (
                    <SelectLegelEntitties
                      value={field.value}
                      multi={false}
                      onChange={field.onChange}
                      className="bg-white"
                      isClearable={false}
                      placeholder={t('placeholders.selectLegalEntity')}
                    />
                  )}
                />
                {errors.legal_entity_id && (
                  <div className="text-xs text-red-500 mt-1">{errors.legal_entity_id.message}</div>
                )}
              </div>
            </div>

            {/* Тип */}
            <div className="flex flex-row gap-2 ">
              <label className="w-[30%] text-sm mb-5  text-[#0f172a] flex items-center gap-1">
                {t('fields.type')}
              </label>
              <div className="flex-1 flex flex-col gap-1 justify-start">
                <Controller
                  name="tip"
                  control={control}
                  render={({ field }) => (
                    <SingleSelect
                      data={accountTypes}
                      value={field.value?.[0] || ''}
                      onChange={(value) => field.onChange(value ? [value] : [])}
                      placeholder={t('placeholders.selectType')}
                      className="flex-1 bg-white"
                      withSearch={false}
                      isClearable={false}
                    />
                  )}
                />
                <div className="flex justiyf-start">
                  {selectedType && (selectedType === 'Безналичный' || selectedType === 'Карта физлица') && (
                    showDetails ? (
                      <button
                        type="button"
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-xs text-primary hover:text-primary-dark transition-colors cursor-pointer"
                      >
                        {t('requisites.hide')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-xs text-primary hover:text-primary-dark transition-colors cursor-pointer"
                      >
                          {t('requisites.show')}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>



            {(selectedType === 'Безналичный' || selectedType === 'Карта физлица') && (
              <div className="">
                {showDetails && (
                  <div className="flex flex-col gap-3 rounded-md">
                    <div className="flex  gap-2">
                      <label className="w-[30%] text-sm  text-[#0f172a] flex items-center">{t('fields.bik')}</label>
                      <div className="flex-1">
                        <Controller
                          name="bik"
                          control={control}
                          render={({ field }) => (
                            <Input type="text" {...field} />
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex  gap-2">
                      <label className="w-[30%] text-sm  text-[#0f172a] flex items-center">{t('fields.bank')}</label>
                      <div className="flex-1">
                        <Controller
                          name="bank"
                          control={control}
                          render={({ field }) => (
                            <Input type="text" {...field} />
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex  gap-2">
                      <label className="w-[30%] text-sm  text-[#0f172a] flex items-center">{t('fields.accountNumber')}</label>
                      <div className="flex-1">
                        <Controller
                          name="rasch_schet"
                          control={control}
                          render={({ field }) => (
                            <Input type="text" {...field} className={cn(errors.rasch_schet && "border-red-500")} />
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex  gap-2">
                      <label className="w-[30%] text-sm  text-[#0f172a] flex items-center">{t('fields.corrAccount')}</label>
                      <div className="flex-1">
                        <Controller
                          name="korr_schet"
                          control={control}
                          render={({ field }) => (
                            <Input type="text" {...field} />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {selectedType === 'Электронный' && (
              <div className="flex flex-row gap-2">
                <label className="w-[30%] text-sm  text-[#0f172a] flex items-center gap-1">{t('fields.number')}</label>
                <div className="flex-1">
                  <Controller
                    name="nomer"
                    control={control}
                    render={({ field }) => (
                      <Input type="text" {...field} placeholder={t('fields.number')} />
                    )}
                  />
                </div>
              </div>
            )}
            {/* Начальный остаток */}
            <div className="flex flex-row gap-2">
              <label className="w-[30%] text-sm  text-[#0f172a] flex items-center gap-1">{t('fields.initialBalance')}</label>
              <div className="flex items-center flex-1 gap-2">
                <Controller
                  name="nachalьnyy_ostatok"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      value={formatAmountInput(field.value)}
                      onChange={(e) => field.onChange(formatAmountInput(e.target.value))}
                      placeholder="0"
                      className="w-fit"
                      onWheel={(e) => e.target.blur()}
                    />
                  )}
                />
              </div>
              <Controller
                name="data_sozdaniya"
                control={control}
                render={({ field }) => (
                  <FormDatepicker
                    value={field.value}
                    onChange={(value) => field.onChange(moment.parseZone(value).format('YYYY-MM-DD'))}
                    placeholder={t('placeholders.selectDate')}
                    format='YYYY-MM-DD'
                    inputClass={'bg-white'}
                    className="w-fit"
                  />
                )}
              />
            </div>

            {/* Валюта */}
            <div className="flex flex-row gap-2">
              <label className="w-[30%] text-sm  text-[#0f172a] flex items-center gap-1">
                {t('fields.currency')}
              </label>
              <div className="flex-1 flex flex-col gap-1">
                <Controller
                  name="currenies_id"
                  control={control}
                  render={({ field }) => (
                    <SingleSelect
                      data={currencies}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={tc('placeholders.selectCurrency')}
                      isClearable={false}
                      className="flex-1 bg-white"
                    />
                  )}
                />
              </div>
            </div>

            {/* Комментарий */}
            <div className="flex flex-row gap-2">
              <label className="w-[30%] text-sm  text-[#0f172a] flex items-center gap-1">{t('fields.comment')}</label>
              <div className="flex-1 flex flex-col gap-1">
                <Controller
                  name="komentariy"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      placeholder={t('placeholders.comment')}
                      className="p-2.5 text-sm resize-none text-[#0f172a] bg-white border border-gray-200 rounded-md transition-all w-full focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-gray-400 min-h-[80px]"
                      rows={4}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-neutral-200 p-4">
          <button
            type="button"
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-transparent rounded-md cursor-pointer transition-all hover:text-[#0f172a] hover:bg-gray-100"
            onClick={handleClose}
          >
            {tc('cancel')}
          </button>
          <button
            type="button"
            className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-md cursor-pointer transition-all hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader /> : (isEdit ? tc('save') : tc('create'))}
          </button>
        </div>
      </div>
    </CustomDialog>
  )
}

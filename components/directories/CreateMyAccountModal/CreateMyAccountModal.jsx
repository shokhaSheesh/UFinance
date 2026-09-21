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
import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '../../shared/CustomDialog'
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
        // Архивный статус меняется отдельным пунктом меню, здесь только сохраняем текущий
        submitData.is_archived = Boolean(account.is_archived)
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
    <CustomDialog open={isOpen} onClose={handleClose} contentClass="w-[600px]">
      <DialogHeader title={isEdit ? t('editTitle') : t('createTitle')} onClose={handleClose} />

      <DialogBody className="flex flex-col gap-4 text-slate-900">
        {/* Название */}
        <FormRow label={t('fields.name')} required error={errors.nazvanie?.message}>
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
        </FormRow>

        {/* Группа */}
        <FormRow label={t('fields.group')}>
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
        </FormRow>

        {/* Юрлицо */}
        <FormRow label={t('fields.legalEntity')} required error={errors.legal_entity_id?.message}>
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
        </FormRow>

        {/* Тип */}
        <FormRow label={t('fields.type')} align="start">
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
          <div className="flex justify-start">
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
        </FormRow>

        {(selectedType === 'Безналичный' || selectedType === 'Карта физлица') && showDetails && (
          <>
            <FormRow label={t('fields.bik')}>
              <Controller
                name="bik"
                control={control}
                render={({ field }) => (
                  <Input type="text" {...field} />
                )}
              />
            </FormRow>
            <FormRow label={t('fields.bank')}>
              <Controller
                name="bank"
                control={control}
                render={({ field }) => (
                  <Input type="text" {...field} />
                )}
              />
            </FormRow>
            <FormRow label={t('fields.accountNumber')}>
              <Controller
                name="rasch_schet"
                control={control}
                render={({ field }) => (
                  <Input type="text" {...field} className={cn(errors.rasch_schet && "border-red-500")} />
                )}
              />
            </FormRow>
            <FormRow label={t('fields.corrAccount')}>
              <Controller
                name="korr_schet"
                control={control}
                render={({ field }) => (
                  <Input type="text" {...field} />
                )}
              />
            </FormRow>
          </>
        )}
        {selectedType === 'Электронный' && (
          <FormRow label={t('fields.number')}>
            <Controller
              name="nomer"
              control={control}
              render={({ field }) => (
                <Input type="text" {...field} placeholder={t('fields.number')} />
              )}
            />
          </FormRow>
        )}

        {/* Начальный остаток */}
        <FormRow label={t('fields.initialBalance')}>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Controller
                name="nachalьnyy_ostatok"
                control={control}
                render={({ field }) => (
                  <Input
                    type="text"
                    value={formatAmountInput(field.value)}
                    onChange={(e) => field.onChange(formatAmountInput(e.target.value))}
                    placeholder="0"
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
        </FormRow>

        {/* Валюта */}
        <FormRow label={t('fields.currency')}>
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
        </FormRow>

        {/* Комментарий */}
        <FormRow label={t('fields.comment')} align="start">
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
        </FormRow>
      </DialogBody>

      <DialogFooter>
        <button
          type="button"
          className="secondary-btn h-9"
          onClick={handleClose}
        >
          {tc('cancel')}
        </button>
        <button
          type="button"
          className="primary-btn"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader /> : (isEdit ? tc('save') : tc('create'))}
        </button>
      </DialogFooter>
    </CustomDialog>
  )
}

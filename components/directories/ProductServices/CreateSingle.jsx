import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '@/components/shared/CustomDialog'
import { keepPreviousData } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useUcodeDefaultApiQuery, useUcodeRequestMutation, useUcodeRequestQuery } from '../../../hooks/useDashboard'
import { queryClient } from '../../../lib/queryClient'
import { appStore } from '../../../store/app.store'
import { formatAmountInput, formatDecimal, StringtoNumber } from '../../../utils/helpers'
import Input from '../../shared/Input'
import Loader from '../../shared/Loader'
import Segmented from '../../shared/Segmented/Segmented'
import SingleSelect from '../../shared/Selects/SingleSelect'
import TextArea from '../../shared/TextArea'

const CreateSingle = observer(({ open = true, setOpen, initialData = null, isEditing = false }) => {
  const t = useTranslations('Directories.product')
  const tc = useTranslations('Common')
  const viewOptions = !appStore.isDonoSchool ? [
    { value: 'product', label: t('types.products') },
    { value: 'service', label: t('types.services') }
  ] : [
    { value: 'service', label: t('types.services') },
    { value: 'product', label: t('types.products') }
  ]

  const { mutateAsync: mutateProductService, isPending } = useUcodeRequestMutation()

  const { data: bankAccountsData } = useUcodeRequestQuery({
    method: "get_my_accounts",
    data: {
      groupBy: "legal_entities"
    },
    querySetting: {
      select: (response) => response?.data?.data,
      placeholderData: keepPreviousData,
    }
  })

  const myCurrencies = useMemo(() => {
    const result = new Map()
    bankAccountsData?.map(item => item?.children).flat()?.forEach(item => {
      result.set(item?.currenies_id, item?.currenies_kod)
    })
    return Array.from(result.entries()).map(([value, label]) => ({ value, label }))
  }, [bankAccountsData])

  const { data: units, } = useUcodeDefaultApiQuery({
    queryKey: "get_product_services_units",
    urlMethod: "GET",
    urlParams: "/items/units_of_measurement?from-ofs=true&data=%7B%22offset%22%3A0%2C%22limit%22%3A100%7D",
    querySetting: {
      select: data => data?.data?.data?.response
    }
  })

  const { data: groups } = useUcodeDefaultApiQuery({
    queryKey: "product_services_groups",
    urlMethod: "GET",
    urlParams: "/items/group_product_and_service?from-ofs=true&data=%7B%22offset%22%3A0%2C%22limit%22%3A1000%7D",
    querySetting: {
      select: data => data?.data?.data?.response
    }
  })

  const groupsList = useMemo(() => {
    return groups?.map(item => {
      return {
        value: item?.guid,
        label: item?.name
      }
    })
  }, [groups])

  const apiOptions = useMemo(() => {
    return units?.map(item => ({
      value: item?.guid, label: `${item?.full_name} ${item?.short_name}`
    }))
  }, [units])

  const defaultValues = useMemo(() => {
    if (initialData) {
      return {
        viewMode: initialData?.status?.[0] === 'service' ? 'service' : 'product',
        name: initialData?.naimenovanie || initialData?.Naimenovanie || '',
        article: initialData?.artikul || initialData?.Artikul || '',
        unit: initialData?.units_of_measurement_id || null,
        group: initialData?.product_and_service_group_id || null, // Initial API does not return a matched group easily 
        price: (initialData?.tsena_za_ed || initialData?.TSena_za_ed || '').toString(),
        currency: initialData?.currenies_id || myCurrencies?.[0]?.value || '',
        vat: (initialData?.nds || initialData?.NDS || '').toString(),
        comment: initialData?.commentary || initialData?.kommentariy || '',
        currency: initialData?.currenies_id || myCurrencies?.[0]?.value || '',

      }
    }
    return {
      viewMode: appStore.isDonoSchool ? 'service' : 'product',
      name: '',
      article: '',
      unit: apiOptions?.[0].value || null,
      group: null,
      price: '',
      currency: myCurrencies?.[0]?.value || '',
      vat: '',
      comment: ''
    }
  }, [initialData, apiOptions, myCurrencies])

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues
  })

  const { viewMode } = watch()

  useEffect(() => {
    if (open) {
      reset(defaultValues)
    }
  }, [open, defaultValues, reset])

  const onSubmit = async (data) => {
    const payload = {
      Naimenovanie: data.name,
      TSena_za_ed: formatDecimal(StringtoNumber(data.price)),
      amount: formatDecimal(StringtoNumber(data.price)),
      unit_of_measurement_id: data.unit,
      NDS: parseInt((data.vat || '').toString().replace('%', '')) || 0,
      product_and_service_group_id: data.group,
      Tip: data.viewMode,
      kommentariy: data.comment,
      currenies_id: data.currency,
    }

    if (data.viewMode === 'product') {
      payload.Artikul = data.article;
    }

    if (isEditing && initialData?.guid) {
      payload.guid = initialData.guid;
    }

    try {
      await mutateProductService({
        method: isEditing ? "update_product_and_service" : "create_product_and_service",
        data: payload
      })
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['get_product_services_list'] })
      queryClient.invalidateQueries({ queryKey: ['list_products_and_services'] })
      queryClient.invalidateQueries({ queryKey: ['get_product_services_groups'] })
    } catch (error) {
      console.error('mutateProductService', error?.message)
    }
  }

  return (
    <CustomDialog open={open} onClose={() => setOpen(false)} contentClass="w-[640px]">
      <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
        <DialogHeader
          title={
            isEditing
              ? (viewMode === 'product' ? t('editProductTitle') : t('editServiceTitle'))
              : (viewMode === 'product' ? t('createProductTitle') : t('createServiceTitle'))
          }
          onClose={() => setOpen(false)}
        />

        <DialogBody className="flex flex-col gap-4">
          <FormRow label={t('fields.type')}>
            <Controller
              name="viewMode"
              control={control}
              render={({ field }) => (
                <Segmented options={viewOptions} value={field.value} onChange={field.onChange} ariaLabel={t('fields.type')} />
              )}
            />
          </FormRow>

          <FormRow
            label={viewMode === 'product' ? t('fields.name') : t('fields.name').replace('товара', 'услуги')}
            required
            error={errors.name?.message}
          >
            <Controller
              name="name"
              control={control}
              rules={{ required: t('errors.nameRequired') }}
              render={({ field }) => (
                <Input
                  placeholder={t('placeholders.name')}
                  className="w-full"
                  value={field.value}
                  error={!!errors.name}
                  onChange={e => field.onChange(e.target.value)}
                />
              )}
            />
          </FormRow>

          {/* Артикул — только у товара; у услуги остаётся одна единица измерения */}
          {viewMode === 'product' && (
            <FormRow label={t('fields.article')}>
              <Controller
                name="article"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder={t('placeholders.article')}
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                  />
                )}
              />
            </FormRow>
          )}

          <FormRow label={t('fields.unit')}>
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <SingleSelect
                  data={apiOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('placeholders.selectUnit')}
                  className={'bg-white'}
                  isClearable={false}
                />
              )}
            />
          </FormRow>

          <FormRow label={viewMode === 'product' ? t('fields.group') : t('fields.group').replace('товаров', 'услуг')}>
            <Controller
              name="group"
              control={control}
              render={({ field }) => (
                <SingleSelect
                  data={groupsList}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('placeholders.selectGroup')}
                  className={'bg-white'}
                />
              )}
            />
          </FormRow>

          <FormRow label={t('fields.price')}>
            <div className="flex items-center gap-2">
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <Input
                    className="flex-1"
                    placeholder={t('placeholders.price')}
                    value={formatAmountInput(field.value)}
                    onChange={e => field.onChange(formatAmountInput(e.target.value))}
                  />
                )}
              />
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <SingleSelect
                    data={myCurrencies}
                    value={field.value || myCurrencies?.[0]?.value}
                    onChange={field.onChange}
                    isClearable={false}
                    withSearch={false}
                    // Валюту нельзя менять только у товара, который уже
                    // используется в операциях/сделках (used === true)
                    disabled={!!initialData?.used}
                    className={'bg-white w-24'}
                  />
                )}
              />
            </div>
          </FormRow>

          <FormRow label={t('fields.vat')}>
            <Controller
              name="vat"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder={t('placeholders.vat')}
                  className="w-[120px]"
                  value={field.value ? `${field.value}%` : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/%/g, '').replace(/\D/g, '').slice(0, 2);
                    field.onChange(raw);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace') {
                      e.preventDefault();
                      const val = String(field.value || '');
                      field.onChange(val.slice(0, -1));
                    }
                  }}
                />
              )}
            />
          </FormRow>

          <FormRow label={t('fields.comment')} align="start">
            <Controller
              name="comment"
              control={control}
              render={({ field }) => (
                <TextArea
                  placeholder={viewMode === 'product' ? t('placeholders.comment') : t('placeholders.comment').replace('товару', 'услуге')}
                  className="w-full resize-y min-h-20"
                  rows={4}
                  value={field.value}
                  hasError={false}
                  onChange={e => field.onChange(e.target.value)}
                />
              )}
            />
          </FormRow>
        </DialogBody>

        <DialogFooter>
          <button type="button" className="secondary-btn h-9" onClick={() => setOpen(false)} disabled={isPending}>
            {tc('cancel')}
          </button>
          <button type="submit" className="primary-btn" disabled={isPending}>
            {isPending ? <Loader /> : isEditing ? tc('save') : tc('create')}
          </button>
        </DialogFooter>
      </form>
    </CustomDialog>
  )
})

export default CreateSingle

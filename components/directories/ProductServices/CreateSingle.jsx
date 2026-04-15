import Modal from '../../common/Modal/Modal'
import styles from './style.module.scss'
import { X } from 'lucide-react'
import { useMemo, useEffect } from 'react'
import SegmentedControl from '../../shared/SegmentedControl'
import Input from '../../shared/Input'
import TextArea from '../../shared/TextArea'
import { useUcodeDefaultApiQuery, useUcodeRequestMutation, useUcodeRequestQuery } from '../../../hooks/useDashboard'
import { queryClient } from '../../../lib/queryClient'
import Loader from '../../shared/Loader'
import { formatDecimal, formatNumber, StringtoNumber } from '../../../utils/helpers'
import { keepPreviousData } from '@tanstack/react-query'
import SingleSelect from '../../shared/Selects/SingleSelect'
import { useForm, Controller } from 'react-hook-form'

const CreateSingle = ({ open = true, setOpen, initialData = null, isEditing = false }) => {
  const viewOptions = [
    { value: 'product', label: 'Товары' },
    { value: 'service', label: 'Услуги' }
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
    urlParams: "/items/group_product_and_service?from-ofs=true&data=%7B%22offset%22%3A0%2C%22limit%22%3A100%7D",
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
      viewMode: 'product',
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
    <Modal
      open={open}
      className={styles.modalBackdrop}
      onClose={() => setOpen(false)}
    >
      <div className={styles.singlecontainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditing
              ? (viewMode === 'product' ? 'Редактирование товара' : 'Редактирование услуги')
              : (viewMode === 'product' ? 'Создание товара' : 'Создание услуги')}
          </h2>

          <div className={styles.headerActions}>
            <button type="button" className={styles.closeButton} onClick={() => setOpen(false)}>
              <X size={20} color="#9ca3af" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <div className={styles.body}>

            <div className={styles.formRow}>
              <div className={styles.label}>Тип</div>
              <div className={styles.fieldContainer}>
                <Controller
                  name="viewMode"
                  control={control}
                  render={({ field }) => (
                    <SegmentedControl
                      options={viewOptions}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.label}>Название товара</div>
              <div className={styles.fieldContainer}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Укажите название' }}
                  render={({ field }) => (
                    <Input
                      placeholder="Например, кафельная плитка"
                      className={styles.fullWidth}
                      value={field.value}
                      error={!!errors.name}
                      onChange={e => field.onChange(e.target.value)}
                    />
                  )}
                />
                {errors.name && <span className={styles.errorMessage}>{errors.name.message}</span>}
              </div>
            </div>

            <div className={styles.formRow}>
              {viewMode === 'product' && <>
                <div className={styles.label}>Артикул</div>
                <div className={styles.fieldContainer}>
                  <Controller
                    name="article"
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="Введите артикул"
                        style={{ width: '140px' }}
                        value={field.value}
                        onChange={e => field.onChange(e.target.value)}
                      />
                    )}
                  />
                </div>
              </>}

              <div className={styles.label}>
                Единица измерения
              </div>
              <div className={`${styles.fieldContainer} ${viewMode === 'service' ? styles.service : ''}`}>
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <SingleSelect
                      data={apiOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Выберите единицу измерения"
                      className={'bg-white'}
                      isClearable={false}
                    />
                  )}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.label}>Группа товаров</div>
              <div className={styles.fieldContainer}>
                <Controller
                  name="group"
                  control={control}
                  render={({ field }) => (
                    <SingleSelect
                      data={groupsList}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Выберите группу"
                      className={'bg-white'}
                    />
                  )}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.labelWithHelp}>
                Цена продажи
              </div>
              <div className={styles.priceGroup}>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <Input
                      className={styles.priceInput}
                      placeholder="0.00"
                      value={formatNumber(field.value)}
                      onChange={e => field.onChange(formatNumber(e.target.value))}
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
                      disabled={isEditing}
                      className={'bg-white'}
                    />
                  )}
                />
              </div>

              <div className={styles.label} style={{ marginLeft: 'auto', width: 'auto', marginRight: '1rem' }}>
                НДС
              </div>
              <div className={styles.fieldContainer} style={{ width: '120px' }}>
                <Controller
                  name="vat"
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="0%"
                      className={styles.fullWidth}
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
              </div>
            </div>

            <div className={styles.formRowTop}>
              <div className={styles.label}>Комментарий</div>
              <div className={styles.fieldContainer}>
                <Controller
                  name="comment"
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      placeholder="Добавьте комментарий к этому товару"
                      className={styles.textArea}
                      rows={4}
                      value={field.value}
                      hasError={false}
                      onChange={e => field.onChange(e.target.value)}
                    />
                  )}
                />
              </div>
            </div>

          </div>

          <div className={styles.footer}>
            <div className={styles.footerButtons}>
              <button type="button" className={styles.cancelButton} onClick={() => setOpen(false)}>
                Отменить
              </button>
              <button type="submit" className={styles.saveButton} disabled={isPending}>
                {isPending ? <Loader /> : isEditing ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default CreateSingle
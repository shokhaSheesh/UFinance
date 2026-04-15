'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import styles from './style.module.scss'
import { useUcodeDefaultApiQuery } from '@/hooks/useDashboard'
import { queryClient } from '../../../../lib/queryClient'
import { formatAmount, formatNumber } from '../../../../utils/helpers'
import Input from '../../../shared/Input'
import { useUcodeRequestMutation, useUcodeRequestQuery } from '../../../../hooks/useDashboard'
import Loader from '../../../shared/Loader'
import SingleSelect from '../../../shared/Selects/SingleSelect'
import { keepPreviousData } from '@tanstack/react-query'
import CustomModal from '../../../shared/CustomModal'

const CreateProductService = ({
  open,
  onClose,
  initialData = null,
  isEditing = false,
  dealGuid = null
}) => {


  const [formData, setFormData] = useState({
    product_and_service_id: initialData?.product_and_service_id || null,
    quantity: initialData?.kolvo != null ? String(initialData.kolvo) : '',
    units_of_measurement_id: initialData?.unit_of_measurement_id || null,
    tsena_za_ed: initialData?.tsena_za_ed != null ? String(initialData.tsena_za_ed) : '',
    discount: initialData?.discount != null ? String(initialData.discount) : '',
    status: Array.isArray(initialData?.status) ? initialData.status[0] : (initialData?.status || ''),
    nds: initialData?.nds != null ? String(initialData.nds) : '',
    artikul: initialData?.artikul || initialData?.article || '',
    group_product_and_service_id: initialData?.group_product_and_service_id || "",
    naimenovanie: initialData?.name || "",
    unit_name: initialData?.unit_name || "",
    currenies_id: initialData?.currenies_id || "",
  })

  const [errors, setErrors] = useState({})

  // Fetch product/service list
  const { data: productServices } = useUcodeRequestQuery({
    method: 'list_products_and_services',
    querySetting: {
      select: data => data?.data?.data,
      placeholderData: keepPreviousData,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 5, // 5 minutes
    }
  })


  const productServicesList = useMemo(() => {
    return productServices?.map(item => ({
      value: item?.guid,
      label: item?.Naimenovanie,
    })) || []
  }, [productServices])

  const { mutateAsync: mutateProductServiceCustom, isPending: isProductServiceCustomPending } = useUcodeRequestMutation()

  // Auto-fill fields when a product/service is selected
  const handleProductServiceChange = (value) => {
    const item = productServices?.find(p => p?.guid === value)
    if (!item) {
      setFormData(prev => ({ ...prev, product_and_service_id: value }))
      return
    }

    const mesurementFullNam = `${item?.unit_name} ${item?.unit_short_name || ''}`


    setFormData(prev => ({
      ...prev,
      product_and_service_id: item?.guid,
      tsena_za_ed: item.TSena_za_ed,
      nds: item.NDS,
      discount: item.Skidka,
      quantity: item.Kol_vo,
      unit_name: mesurementFullNam,
      units_of_measurement_id: item?.units_of_measurement_id,
      status: item.Status,
      artikul: item?.Artikul,
      naimenovanie: item?.Naimenovanie,
      currenies_id: item?.currenies_id,
      group_product_and_service_id: item?.product_and_service_group_id
    }))
  }

  const setPercent = (field) => (e) => {
    const raw = e.target.value.replace(/%/g, '').replace(/[^0-9.]/g, '').slice(0, 3)
    setFormData(prev => ({ ...prev, [field]: raw }))
  }

  const handlePercentKeyDown = (field) => (e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      setFormData(prev => ({ ...prev, [field]: String(prev[field] || '').slice(0, -1) }))
    }
  }

  // Calculate total sum
  const totalSum = useMemo(() => {
    const qty = parseFloat(String(formData.quantity).replace(/\s/g, '')) || 0
    const priceVal = parseFloat(String(formData.tsena_za_ed).replace(/\s/g, '')) || 0
    const discountVal = parseFloat(String(formData.discount).replace(/[^0-9.]/g, '')) || 0
    const ndsVal = parseFloat(String(formData.nds).replace(/[^0-9.]/g, '')) || 0
    const subtotal = qty * priceVal
    const afterDiscount = subtotal * (1 - discountVal / 100)
    const afterNds = afterDiscount * (1 + ndsVal / 100)
    return isNaN(afterNds) ? 0 : Number(afterNds).toFixed(2)
  }, [formData.quantity, formData.tsena_za_ed, formData.discount, formData.nds])


  const resetForm = () => {
    setFormData({
      product_and_service_id: null,   // selected product/service option {value, label}
      quantity: '',
      units_of_measurement_id: null,  // selected unit option {value, label}
      tsena_za_ed: '',
      discount: '',
      status: '',
      nds: '',
      artikul: '',
      group_product_and_service_id: "",
      naimenovanie: ""
    })
  }

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevInitialData, setPrevInitialData] = useState(initialData)

  if (open !== prevOpen || initialData !== prevInitialData) {
    setPrevOpen(open)
    setPrevInitialData(initialData)

    if (open) {
      if (initialData) {
        console.log('initialData', initialData)
        setFormData({
          product_and_service_id: initialData.product_and_service_id || null,
          quantity: initialData.kolvo != null ? String(initialData.kolvo) : '',
          units_of_measurement_id: initialData.unit_of_measurement_id || null,
          unit_name: initialData.unit_name || '',
          tsena_za_ed: initialData.tsena_za_ed != null ? String(initialData.tsena_za_ed) : '',
          discount: initialData.discount != null ? String(initialData.discount) : '',
          status: Array.isArray(initialData.status) ? initialData.status[0] : (initialData.status || ''),
          nds: initialData.nds != null ? String(initialData.nds) : '',
          artikul: initialData.artikul || initialData.article || '',
          group_product_and_service_id: initialData.group_product_and_service_id || '',
          naimenovanie: initialData.name || '',
          currenies_id: initialData.currenies_id || '',
        })

      } else {
        resetForm()
      }
    }
  }

  // Block body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const validate = () => {
    const newErrors = {}
    if (!formData.product_and_service_id) newErrors.product_and_service_id = 'Выберите наименование'
    if (!formData.quantity) newErrors.quantity = 'Введите количество'
    if (!formData.tsena_za_ed) newErrors.tsena_za_ed = 'Введите цену'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreate = async () => {
    if (!validate()) return

    const object_data = {
      Naimenovanie: formData?.naimenovanie || '',
      Kol_vo: Number(parseFloat(String(formData?.quantity || '0').replace(/\s/g, '') || 0).toFixed(2)),
      TSena_za_ed: Number(parseFloat(String(formData?.tsena_za_ed || '0').replace(/\s/g, '') || 0).toFixed(2)),
      Skidka: Number(parseFloat(String(formData?.discount || '0').replace(/\s/g, '') || 0).toFixed(2)),
      Summa: Number(totalSum),
      Tip: "product",
      currenies_id: formData?.currenies_id || "",
    };

    if (!isEditing && dealGuid) {
      object_data.sales_transaction_id = dealGuid;
    }

    if (isEditing && initialData?.guid) {
      object_data.guid = initialData.guid;
      object_data.product_and_service_id = initialData.product_and_service_id;
      object_data.sales_transactions_id = dealGuid;
    }

    if (formData?.product_and_service_id) {
      object_data.product_and_service_id = formData.product_and_service_id;
    }
    if (formData?.units_of_measurement_id) {
      object_data.units_of_measurement_id = formData.units_of_measurement_id;
    }

    if (formData?.nds) {
      object_data.Nds = Number(String(formData?.nds || '0').replace(/\s/g, ''));
    }

    if (formData?.artikul) {
      object_data.article = formData.artikul;
    }

    if (formData?.group_product_and_service_id) {
      object_data.product_and_service_group_id = formData.group_product_and_service_id;
    }

    if (formData?.comment) {
      object_data.commentary = formData.comment;
    }

    if (formData?.status) {
      object_data.status = formData.status;
    }


    try {
      await mutateProductServiceCustom({
        method: isEditing ? "update_product_and_service" : "create_product_and_service",
        data: object_data
      })
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['get_sales_transaction_by_guid'] })
      queryClient.invalidateQueries({ queryKey: ['products_services_list'] })
      onClose()
    } catch (error) {
      console.error('mutateProductService', error?.message)
    }
  }


  return (
    <CustomModal isOpen={open} onClose={onClose} className={'w-[500px]! p-0'}>
      <div className="">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Редактировать позицию' : 'Добавить товар/услугу'}
          </h2>
          <p className="text-sm text-gray-ucode-500">Заполните данные позиции сделки</p>
        </div>

        {/* Body */}
        <div className="p-4 py-5">
          {/* Наименование */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Наименование <span className="text-red-500">*</span>
            </label>
            <SingleSelect
              data={productServicesList}
              value={formData.product_and_service_id}
              onChange={handleProductServiceChange}
              placeholder='Наименование'
              className={'h-[38]! bg-white'}
            />
            {errors.product_and_service_id && (
              <span className={styles.errorText}>{errors.product_and_service_id}</span>
            )}
          </div>

          {/* Кол-во / Единица */}
          <div className={styles.twoCol}>
            <div className={styles.colItem}>
              <label className={styles.label}>
                Кол-во <span className={styles.required}>*</span>
              </label>
              <Input
                type='text'
                value={formatNumber(formData.quantity)}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: formatNumber(e.target.value) }))}
                className={`${styles.input} ${errors.quantity ? styles.inputError : ''}`}
                placeholder='0'
              />
              {errors.quantity && <span className={styles.errorText}>{errors.quantity}</span>}
            </div>
            <div className={styles.colItem}>
              <label className={styles.label}>Единица</label>
              <Input
                type='text'
                value={formData.unit_name || ''}
                className={styles.input}
                placeholder='Единица'
                readOnly
              />
            </div>
          </div>

          {/* Цена за ед. */}
          <div className={styles.formRow}>
            <label className={styles.label}>
              Цена за ед. <span className={styles.required}>*</span>
            </label>
            <Input
              type='text'
              value={formatNumber(formData.tsena_za_ed)}
              onChange={(e) => setFormData(prev => ({ ...prev, tsena_za_ed: formatNumber(e.target.value) }))}
              className={`${styles.input} ${styles.textRight} ${errors.tsena_za_ed ? styles.inputError : ''}`}
              placeholder='Цена за ед.'
            />
            {errors.tsena_za_ed && <span className={styles.errorText}>{errors.tsena_za_ed}</span>}
          </div>

          {/* Скидка / НДС */}
          <div className={styles.twoCol}>
            <div className={styles.colItem}>
              <label className={styles.label}>Скидка</label>
              <Input
                type='text'
                maxLength={3}
                value={formData.discount ? `${formData.discount}%` : ''}
                onChange={setPercent('discount')}
                onKeyDown={handlePercentKeyDown('discount')}
                className={`${styles.input} ${styles.textRight}`}
                placeholder='0%'
              />
            </div>
            <div className={styles.colItem}>
              <label className={styles.label}>НДС</label>
              <Input
                type='text'
                maxLength={3}
                value={formData.nds ? `${formData.nds}%` : ''}
                onChange={setPercent('nds')}
                onKeyDown={handlePercentKeyDown('nds')}
                className={`${styles.input} ${styles.textRight}`}
                placeholder='0%'
              />
            </div>
          </div>

          {/* Сумма */}
          <div className={styles.formRow}>
            <label className={styles.label}>Сумма</label>
            <div className={`text-end border border-gray-ucode-200 rounded-lg px-3 py-2`}>
              {formatAmount(totalSum)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-3 border-t">
          <button className="secondary-btn" onClick={onClose}>
            Отменить
          </button>
          <button
            className='primary-btn'
            onClick={handleCreate}
            disabled={isProductServiceCustomPending}
          >
            {isProductServiceCustomPending ? <Loader /> : isEditing ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </CustomModal>
  )
}

export default CreateProductService
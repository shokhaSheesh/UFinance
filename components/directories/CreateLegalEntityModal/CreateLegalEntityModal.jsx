"use client"

import { cn } from '@/app/lib/utils'
import Input from '@/components/shared/Input'
import TextArea from '@/components/shared/TextArea'
import { useCreateLegalEntity, useUpdateLegalEntity } from '@/hooks/useDashboard'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useUcodeDefaultApiQuery } from '../../../hooks/useDashboard'
import { queryClient } from '../../../lib/queryClient'
import { authStore } from '../../../store/auth.store'
import CustomDialog from '../../shared/CustomDialog'

export default observer(function CreateLegalEntityModal({ isOpen, onClose, legalEntity = null, legalEntityId }) {
  const t = useTranslations('Directories.legalEntity')
  const tc = useTranslations('Common')
  const createMutation = useCreateLegalEntity()
  const updateMutation = useUpdateLegalEntity()
  const isEdit = !!legalEntity && !!legalEntity.guid

  const { data } = useUcodeDefaultApiQuery({
    queryKey: "get_legal_entities",
    urlMethod: "GET",
    urlParams: `/items/legal_entity/${legalEntityId}`,
    querySetting: {
      select: (response) => response?.data?.data?.response,
      enabled: !!legalEntityId
    }
  })

  const [formData, setFormData] = useState({
    nazvanie: data?.nazvanie || '',
    polnoe_nazvanie: data?.polnoe_nazvanie || '',
    inn: data?.inn || '',
    kpp: data?.kpp || '',
    komentariy: data?.komentariy || ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (isEdit && legalEntity && legalEntity.guid) {
        setFormData({
          nazvanie: legalEntity.nazvanie || legalEntity.name || '',
          polnoe_nazvanie: legalEntity.polnoe_nazvanie || '',
          inn: legalEntity.inn?.toString() || '',
          kpp: legalEntity.kpp?.toString() || '',
          komentariy: legalEntity.komentariy || ''
        })
      } else {
        setFormData({
          nazvanie: '',
          polnoe_nazvanie: '',
          inn: '',
          kpp: '',
          komentariy: ''
        })
      }
      setErrors({})
    }
  }, [isOpen, legalEntity, isEdit])

  useEffect(() => {
    if (data && isEdit && isOpen) {
      setFormData({
        nazvanie: data.nazvanie || '',
        polnoe_nazvanie: data.polnoe_nazvanie || '',
        inn: data.inn?.toString() || '',
        kpp: data.kpp?.toString() || '',
        komentariy: data.komentariy || ''
      })
    }
  }, [data, isEdit, isOpen])

  const handleClose = () => {
    onClose()
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nazvanie.trim()) {
      newErrors.nazvanie = t('errors.nameRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      const submitData = {
        nazvanie: formData.nazvanie.trim(),
        polnoe_nazvanie: formData.polnoe_nazvanie?.trim() || null,
        inn: formData.inn || null,
        kpp: formData.kpp || null,
        komentariy: formData.komentariy?.trim() || null,
        legal_entity_id: authStore.userData?.legal_entity_id || null
      }

      let result = null
      if (isEdit) {
        await updateMutation.mutateAsync({ ...submitData, guid: legalEntity.guid })
        result = { ...submitData, guid: legalEntity.guid }
      } else {
        const response = await createMutation.mutateAsync(submitData)
        if (response?.data?.data) {
          result = response.data.data
        } else if (response?.data) {
          result = response.data
        } else {
          result = submitData
        }
      }

      queryClient.invalidateQueries({ queryKey: ['get_legal_entities'] })
      queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })

      onClose(result)
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} legal entity:`, error)
      setErrors({ submit: error.message || (isEdit ? t('errors.updateFailed') : t('errors.createFailed')) })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomDialog open={isOpen} onClose={handleClose} contentClass="p-0">
      <div className="flex flex-col bg-white rounded-lg max-h-[90vh] w-[600px]" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
          <h3 id="modal-title" className="text-[18px] font-semibold text-slate-900 m-0">
            {isEdit ? t('editTitle') : t('createTitle')}
          </h3> 
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="flex flex-col gap-6">
            {/* Название */}
            <div className="flex flex-row gap-2.5">
              <label className="text-sm font-medium w-[30%] text-slate-700">
                {t('fields.name')} <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col gap-2 flex-1">
                <Input
                  type="text"
                  value={formData.nazvanie}
                  onChange={(e) => setFormData({ ...formData, nazvanie: e.target.value })}
                  placeholder={t('placeholders.name')}
                  className={cn(errors.nazvanie && 'border-red-500')}
                />
                {errors.nazvanie && <p className="text-xs text-red-500 mt-1">{errors.nazvanie}</p>}
              </div>
            </div>

            {/* Полное название */}
            <div className="flex flex-row gap-2.5">
              <label className="text-sm font-medium w-[30%] text-slate-700">{t('fields.fullName')}</label>
              <div className="flex flex-col gap-2 flex-1">
                <Input
                  type="text"
                  value={formData.polnoe_nazvanie}
                  onChange={(e) => setFormData({ ...formData, polnoe_nazvanie: e.target.value })}
                  placeholder={t('placeholders.fullName')}
                />
              </div>
            </div>

            {/* ИНН/КПП */}
            <div className="flex flex-row gap-2.5">
              <label className="text-sm font-medium w-[30%] text-slate-700">{t('fields.innKpp')}</label>
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={formData.inn}
                    onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                    placeholder=""
                    className="flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    onWheel={(e) => e.target.blur()}
                  />
                  <span className="text-sm font-medium text-gray-500 shrink-0">/</span>
                  <Input
                    type="number"
                    value={formData.kpp}
                    onChange={(e) => setFormData({ ...formData, kpp: e.target.value })}
                    placeholder=""
                    className="flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>
            </div>

            {/* Комментарий */}
            <div className="flex flex-row gap-2.5">
              <label className="text-sm font-medium w-[30%] text-slate-700">{t('fields.comment')}</label>
              <div className="flex flex-col gap-2 flex-1">
                <TextArea
                  value={formData.komentariy}
                  onChange={(e) => setFormData({ ...formData, komentariy: e.target.value })}
                  placeholder={t('placeholders.comment')}
                  rows={4}
                  hasError={!!errors.komentariy}
                />
              </div>
            </div>

            {errors.submit && (
              <div className="text-xs text-red-500 mt-1">{errors.submit}</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-2 border-t border-gray-200">
          <button
            className="secondary-btn"
            onClick={handleClose}
          >
            {tc('cancel')}
          </button>
          <button
            className="primary-btn disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (isEdit ? tc('saving') : tc('creating')) : (isEdit ? tc('save') : tc('create'))}
          </button>
        </div>
      </div>
    </CustomDialog>
  )
})

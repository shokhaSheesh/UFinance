"use client"

import { cn } from '@/app/lib/utils'
import Input from '@/components/shared/Input'
import TextArea from '@/components/shared/TextArea'
import { useCreateLegalEntity, useUpdateLegalEntity } from '@/hooks/useDashboard'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useUcodeDefaultApiQuery } from '../../../hooks/useDashboard'
import { queryClient } from '../../../lib/queryClient'
import { authStore } from '../../../store/auth.store'
import styles from './CreateLegalEntityModal.module.scss'

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
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const modalRef = useRef(null)
  const overlayRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      // Small delay to ensure smooth animation
      requestAnimationFrame(() => {
        setIsVisible(true)
      })

      // Initialize form data from props first
      if (isEdit && legalEntity && legalEntity.guid) {
        // Editing existing legal entity
        setFormData({
          nazvanie: legalEntity.nazvanie || legalEntity.name || '',
          polnoe_nazvanie: legalEntity.polnoe_nazvanie || '',
          inn: legalEntity.inn?.toString() || '',
          kpp: legalEntity.kpp?.toString() || '',
          komentariy: legalEntity.komentariy || ''
        })
      } else {
        // Creating new legal entity
        setFormData({
          nazvanie: '',
          polnoe_nazvanie: '',
          inn: '',
          kpp: '',
          komentariy: ''
        })
      }
      setErrors({})
    } else {
      setIsVisible(false)
    }
  }, [isOpen, legalEntity, isEdit])

  // Update form data when async data arrives from API
  useEffect(() => {
    if (data && isEdit) {
      setFormData({
        nazvanie: data.nazvanie || '',
        polnoe_nazvanie: data.polnoe_nazvanie || '',
        inn: data.inn?.toString() || '',
        kpp: data.kpp?.toString() || '',
        komentariy: data.komentariy || ''
      })
    }
  }, [data, isEdit])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 250)
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
        // Extract the created entity from the API response
        // Response structure: { status: 'OK', data: { data: { guid, nazvanie, ... } } }
        if (response?.data?.data) {
          result = response.data.data
        } else if (response?.data) {
          result = response.data
        } else {
          // Fallback: construct from submitted data (guid will be missing but that's ok)
          result = submitData
        }
      }

      queryClient.invalidateQueries({ queryKey: ['get_legal_entities'] })
      queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })

      setIsClosing(true)
      setTimeout(() => {
        setIsVisible(false)
        onClose(result)
      }, 250)
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} legal entity:`, error)
      setErrors({ submit: error.message || (isEdit ? t('errors.updateFailed') : t('errors.createFailed')) })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isVisible) return null

  const modalContent = (
    <>
      <div
        ref={overlayRef}
        className={cn(styles.overlay, isClosing ? styles.closing : styles.opening)}
        onClick={handleClose}
      />
      <div
        ref={modalRef}
        className={cn(styles.modal, isClosing ? styles.closing : styles.opening)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.header}>
          <h3 id="modal-title" className={styles.title}>
            {isEdit ? t('editTitle') : t('createTitle')}
          </h3>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label={tc('close')}
          >
            <svg className={styles.closeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.form}>
            {/* Название */}
            <div className={styles.formRow}>
              <label className={styles.label}>
                {t('fields.name')} <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputContainer}>
                <Input
                  type="text"
                  value={formData.nazvanie}
                  onChange={(e) => setFormData({ ...formData, nazvanie: e.target.value })}
                  placeholder={t('placeholders.name')}
                  className={cn(styles.input, errors.nazvanie && styles.inputError)}
                />
                {errors.nazvanie && <p className={styles.errorMessage}>{errors.nazvanie}</p>}
              </div>
            </div>

            {/* Полное название */}
            <div className={styles.formRow}>
              <label className={styles.label}>{t('fields.fullName')}</label>
              <div className={styles.inputContainer}>
                <Input
                  type="text"
                  value={formData.polnoe_nazvanie}
                  onChange={(e) => setFormData({ ...formData, polnoe_nazvanie: e.target.value })}
                  placeholder={t('placeholders.fullName')}
                  className={styles.input}
                />
              </div>
            </div>

            {/* ИНН/КПП */}
            <div className={styles.formRow}>
              <label className={styles.label}>{t('fields.innKpp')}</label>
              <div className={styles.inputContainer}>
                <div className={styles.innKppContainer}>
                  <Input
                    type="number"
                    value={formData.inn}
                    onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                    placeholder=""
                    className={styles.input}
                    onWheel={(e) => e.target.blur()}
                  />
                  <span className={styles.slash}>/</span>
                  <Input
                    type="number"
                    value={formData.kpp}
                    onChange={(e) => setFormData({ ...formData, kpp: e.target.value })}
                    placeholder=""
                    className={styles.input}
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
              </div>
            </div>

            {/* Комментарий */}
            <div className={styles.formRow}>
              <label className={styles.label}>{t('fields.comment')}</label>
              <div className={styles.inputContainer}>
                <TextArea
                  value={formData.komentariy}
                  onChange={(e) => setFormData({ ...formData, komentariy: e.target.value })}
                  placeholder={t('placeholders.comment')}
                  className={styles.textarea}
                  rows={4}
                  hasError={!!errors.komentariy}
                />
              </div>
            </div>

            {errors.submit && (
              <div className={styles.errorMessage}>{errors.submit}</div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={handleClose}>
            {tc('cancel')}
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (isEdit ? tc('saving') : tc('creating')) : (isEdit ? tc('save') : tc('create'))}
          </button>
        </div>
      </div>
    </>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
})

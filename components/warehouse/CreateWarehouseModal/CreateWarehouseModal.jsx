'use client'

import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '@/components/shared/CustomDialog'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import Input from '@/components/shared/Input'
import TextArea from '@/components/shared/TextArea'
import { useCreateWarehouse, useUpdateWarehouse } from '@/hooks/useDashboard'
import { cn } from '@/lib/utils'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

const EMPTY_FORM = { name: '', address: '', comment: '', is_default: false }

export default observer(function CreateWarehouseModal({ isOpen, onClose, warehouse = null }) {
  const t = useTranslations('Warehouse.createModal')
  const tc = useTranslations('Common')
  const createMutation = useCreateWarehouse()
  const updateMutation = useUpdateWarehouse()
  const isEdit = !!warehouse?.guid

  const [formData, setFormData] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isOpen) return
    if (isEdit) {
      setFormData({
        name: warehouse.name || '',
        address: warehouse.address || '',
        comment: warehouse.comment || '',
        is_default: !!warehouse.is_default,
      })
    } else {
      setFormData(EMPTY_FORM)
    }
    setErrors({})
  }, [isOpen, warehouse, isEdit])

  const handleClose = () => {
    if (createMutation.isPending || updateMutation.isPending) return
    onClose()
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = t('nameRequired')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: formData.name.trim(),
      address: formData.address.trim() || null,
      comment: formData.comment.trim() || null,
      is_default: formData.is_default,
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ ...payload, guid: warehouse.guid })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onClose()
    } catch {
      // notification already shown by the mutation's onError
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <CustomDialog open={isOpen} onClose={handleClose} contentClass="w-[560px]">
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
        <DialogHeader title={isEdit ? t('titleEdit') : t('titleNew')} onClose={handleClose} />
        <DialogBody className="flex flex-col gap-5">
          <FormRow label={t('name')} required error={errors.name}>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
              }}
              placeholder={t('namePlaceholder')}
              className={cn(errors.name && 'border-red-500')}
              autoFocus
            />
          </FormRow>
          <FormRow label={t('address')}>
            <Input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder={t('addressPlaceholder')}
            />
          </FormRow>
          <FormRow label={t('comment')} align="start">
            <TextArea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder={t('commentPlaceholder')}
              rows={3}
            />
          </FormRow>
          <FormRow label="">
            <OperationCheckbox
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              label={t('isDefault')}
            />
          </FormRow>
        </DialogBody>
        <DialogFooter>
          <button type="button" className="secondary-btn h-9" onClick={handleClose} disabled={isSubmitting}>
            {tc('cancel')}
          </button>
          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? (isEdit ? tc('saving') : tc('creating')) : (isEdit ? tc('save') : tc('create'))}
          </button>
        </DialogFooter>
      </form>
    </CustomDialog>
  )
})

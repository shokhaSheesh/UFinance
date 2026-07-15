'use client'

import CustomDialog from '@/components/shared/CustomDialog'
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
    <CustomDialog open={isOpen} onClose={handleClose} contentClass="p-0">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col bg-white rounded-lg max-h-[90vh] w-[520px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="warehouse-modal-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 id="warehouse-modal-title" className="text-lg font-semibold text-slate-900 m-0">
            {isEdit ? t('titleEdit') : t('titleNew')}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              {t('name')} <span className="text-red-500">*</span>
            </label>
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
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">{t('address')}</label>
            <Input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder={t('addressPlaceholder')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">{t('comment')}</label>
            <TextArea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder={t('commentPlaceholder')}
              rows={3}
            />
          </div>

          <OperationCheckbox
            checked={formData.is_default}
            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
            label={t('isDefault')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button type="button" className="secondary-btn" onClick={handleClose} disabled={isSubmitting}>
            {tc('cancel')}
          </button>
          <button
            type="submit"
            className="primary-btn disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (isEdit ? tc('saving') : tc('creating')) : (isEdit ? tc('save') : tc('create'))}
          </button>
        </div>
      </form>
    </CustomDialog>
  )
})

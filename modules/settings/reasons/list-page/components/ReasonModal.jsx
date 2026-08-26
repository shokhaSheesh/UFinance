'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import Input from '@/components/shared/Input'
import { Loader } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { useSaveReason } from '../hooks/useReasonsData'

export default function ReasonModal({ open, onClose, initialReason }) {
  const tr = useTranslations('Settings.reasons')
  const tc = useTranslations('Settings.common')
  const { save, isSaving } = useSaveReason()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: { description: initialReason?.description || '' },
  })

  const handleClose = () => {
    reset()
    onClose?.()
  }

  const onSubmit = async (data) => {
    await save({ guid: initialReason?.guid, description: data?.description?.trim() })
    handleClose()
  }

  return (
    <CustomDialog
      open={open}
      onClose={handleClose}
      contentClass="w-[480px] max-w-[95vw] p-0 overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-ucode-800">
          {initialReason ? tr('edit') : tr('add')}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-6 py-5 flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-ucode-600">{tr('description')}</label>
          <Input
            autoFocus
            placeholder={tr('descriptionPlaceholder')}
            error={!!errors?.description}
            {...register('description', { required: tr('errors.descriptionRequired') })}
          />
          {errors?.description && (
            <span className="text-xs text-red-ucode">{errors?.description?.message}</span>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button type="button" onClick={handleClose} disabled={isSaving} className="outline-btn">
            {tc('cancel')}
          </button>
          <button type="submit" disabled={isSaving} className="primary-btn">
            {isSaving && <Loader size={14} className="animate-spin" />}
            {isSaving ? tc('saving') : initialReason ? tc('save') : tc('create')}
          </button>
        </div>
      </form>
    </CustomDialog>
  )
}

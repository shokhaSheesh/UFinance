'use client'

import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '@/components/shared/CustomDialog'
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
    <CustomDialog open={open} onClose={handleClose} contentClass="w-[520px]">
      <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
        <DialogHeader title={initialReason ? tr('edit') : tr('add')} onClose={handleClose} />
        <DialogBody>
          <FormRow label={tr('description')} required error={errors?.description?.message}>
            <Input
              autoFocus
              placeholder={tr('descriptionPlaceholder')}
              error={!!errors?.description}
              {...register('description', { required: tr('errors.descriptionRequired') })}
            />
          </FormRow>
        </DialogBody>
        <DialogFooter>
          <button type="button" onClick={handleClose} disabled={isSaving} className="secondary-btn h-9">
            {tc('cancel')}
          </button>
          <button type="submit" disabled={isSaving} className="primary-btn">
            {isSaving && <Loader size={14} className="animate-spin" />}
            {isSaving ? tc('saving') : initialReason ? tc('save') : tc('create')}
          </button>
        </DialogFooter>
      </form>
    </CustomDialog>
  )
}

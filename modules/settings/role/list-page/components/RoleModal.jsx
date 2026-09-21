'use client'

import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '@/components/shared/CustomDialog'
import Input from '@/components/shared/Input'
import { apiClient } from '@/lib/api/ucode/base'
import { queryClient } from '@/lib/queryClient'
import { useMutation } from '@tanstack/react-query'
import { Loader } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

export default function RoleModal({ open, onClose, initialRole, onSuccess }) {
  const tr = useTranslations('Settings.roles')
  const tc = useTranslations('Settings.common')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: initialRole?.name || '',
      description: initialRole?.description || '',
    },
  })

  const { mutateAsync: saveRole, isPending: isSaving } = useMutation({
    mutationKey: ['role_control'],
    mutationFn: ({ method, data }) => apiClient.invokeFunction({ method, data, type: 'role' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get_roles'] })
      onSuccess?.()
      onClose?.()
      reset()
    },
  })

  const onSubmit = async (data) => {
    const method = initialRole ? 'update_role' : 'create_role'
    const payload = {
      method,
      data: initialRole
        ? {
          guid: initialRole?.guid,
          name: data?.name,
          description: data?.description,
        }
        : {
          name: data?.name,
          description: data?.description,
        },
    }
    await saveRole(payload)
  }

  const handleClose = () => {
    reset()
    onClose?.()
  }

  return (
    <CustomDialog open={open} onClose={handleClose} contentClass="w-[520px]">
      <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
        <DialogHeader title={initialRole ? tr('edit') : tr('add')} onClose={handleClose} />
        <DialogBody className="flex flex-col gap-5">
          <FormRow label={tr('name')} required error={errors?.name?.message}>
            <Input
              placeholder={tr('namePlaceholder')}
              error={!!errors?.name}
              {...register('name', { required: tr('errors.nameRequired') })}
            />
          </FormRow>
          <FormRow label={tr('description')}>
            <Input
              placeholder={tr('descriptionPlaceholder')}
              error={!!errors?.description}
              {...register('description')}
            />
          </FormRow>
        </DialogBody>
        <DialogFooter>
          <button type="button" onClick={handleClose} disabled={isSaving} className="secondary-btn h-9">
            {tc('cancel')}
          </button>
          <button type="submit" disabled={isSaving} className="primary-btn">
            {isSaving && <Loader size={14} className="animate-spin" />}
            {isSaving ? tc('saving') : initialRole ? tc('save') : tc('create')}
          </button>
        </DialogFooter>
      </form>
    </CustomDialog>
  )
}

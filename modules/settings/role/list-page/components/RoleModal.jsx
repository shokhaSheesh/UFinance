'use client'

import CustomDialog from '@/components/shared/CustomDialog'
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
    <CustomDialog open={open} onClose={handleClose} contentClass="w-[480px] max-w-[95vw] p-7">
      <h2 className="text-lg font-bold text-slate-900 mb-6">
        {initialRole ? tr('edit') : tr('add')}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-500">{tr('name')}</label>
          <Input
            placeholder={tr('namePlaceholder')}
            error={!!errors?.name}
            {...register('name', { required: tr('errors.nameRequired') })}
          />
          {errors?.name && <span className="text-xs text-red-500">{errors?.name?.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-500">{tr('description')}</label>
          <Input
            placeholder={tr('descriptionPlaceholder')}
            error={!!errors?.description}
            {...register('description')}
          />
        </div>

        <div className="flex justify-end gap-2.5 mt-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="px-5 py-2 bg-white text-slate-500 border border-gray-300 rounded-lg text-sm font-medium hover:border-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {tc('cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-[#0E73F6] text-white rounded-lg text-sm font-semibold hover:bg-[#0b5fd4] transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
          >
            {isSaving && <Loader size={14} className="animate-spin" />}
            {isSaving ? tc('saving') : initialRole ? tc('save') : tc('create')}
          </button>
        </div>
      </form>
    </CustomDialog>
  )
}

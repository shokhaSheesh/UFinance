'use client'

import CustomModal from '@/components/shared/CustomModal'
import Input from '@/components/shared/Input'
import { useUcodeRequestMutation } from '@/hooks/useDashboard'
import { queryClient } from '@/lib/queryClient'
import { authStore } from '@/store/auth.store'
import { Loader } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'
import { useEmailUserSearch } from '../hooks/useBranchModal'
import { EMAIL_RE, formatPhone998, isValidPhone998 } from '../utils/phoneUtils'

function BranchModal({ open, onClose, onSubmit, initial }) {
  const tb = useTranslations('Settings.branches')
  const tc = useTranslations('Settings.common')

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: initial?.branchName || initial?.name || '',
      username: '',
      email: '',
      phone: '+998',
    },
  })

  const { mutateAsync: createBranchUser, isPending: isCreating } = useUcodeRequestMutation({
    mutationSetting: {
      onSuccess: (response) => {
        if (initial && initial?.branch_id === authStore.selectBranch?.guid) {
          authStore.setSelectBranch(response?.data?.data?.branch)
        }
      },
    },
  })

  const {
    emailSearch,
    setEmailSearch,
    setSelectedUser,
    dropdownOpen,
    setDropdownOpen,
    dropdownRef,
    usersList,
    usersLoading,
  } = useEmailUserSearch()

  async function onFormSubmit(data) {
    if (!initial) {
      await createBranchUser({
        method: 'create_branch',
        data: {
          branch_name: data?.name,
          branch_user_id: null,
          branch_user_email: data?.email,
          branch_user_name: data?.username,
          branch_user_phone: String(data?.phone).replace(/\s/g, ''),
        },
      })
    } else {
      await createBranchUser({
        method: 'update_branch',
        data: {
          guid: initial?.branch_id,
          branch_name: data?.name,
        },
      })
    }
    queryClient.invalidateQueries({ queryKey: ['get_my_branches'] })
    onSubmit?.(data)
    onClose?.()
  }

  return (
    <CustomModal isOpen={open} onClose={onClose} className="w-[480px] max-w-[95vw] p-7">
      <h2 className="text-lg font-bold text-slate-900 mb-6">
        {initial ? tb('edit') : tb('create')}
      </h2>

      <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
        {/* Branch name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-500">{tb('name')}</label>
          <Input
            placeholder={tb('namePlaceholder')}
            error={!!errors?.name}
            {...register('name', { required: tb('errors.nameRequired') })}
          />
          {errors?.name && <span className="text-xs text-red-500">{errors?.name?.message}</span>}
        </div>

        {!initial?.name && (
          <>
            {/* Email with user search */}
            <div className="flex flex-col gap-1.5" ref={dropdownRef}>
              <label className="text-sm font-medium text-slate-500">{tb('email')}</label>
              <div className="relative">
                {(() => {
                  const { ref, name } = register('email', {
                    required: tb('errors.emailRequired'),
                    pattern: { value: EMAIL_RE, message: tb('errors.emailInvalid') },
                  })
                  return (
                    <Input
                      ref={ref}
                      name={name}
                      type="email"
                      placeholder={tb('emailPlaceholder')}
                      error={!!errors?.email}
                      value={emailSearch}
                      readOnly={!!initial?.email}
                      onChange={(e) => {
                        setEmailSearch(e.target.value)
                        setValue('email', e.target.value)
                        setSelectedUser(null)
                        setDropdownOpen(true)
                      }}
                      onFocus={() => emailSearch.length >= 2 && setDropdownOpen(true)}
                    />
                  )
                })()}
                {usersLoading && emailSearch.length >= 2 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader size={14} className="animate-spin text-slate-400" />
                  </span>
                )}
                {dropdownOpen && usersList?.length > 0 && (
                  <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto py-1">
                    {usersList?.map((user) => (
                      <li
                        key={user?.guid}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelectedUser(user)
                          setEmailSearch(user?.email || '')
                          setValue('email', user?.email || '', { shouldValidate: true })
                          setValue('username', user?.name || user?.username || '')
                          setValue('phone', user?.phone ? formatPhone998(user?.phone) : '+998')
                          setDropdownOpen(false)
                        }}
                        className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer flex flex-col"
                      >
                        <span className="font-medium">{user?.name || user?.username || '—'}</span>
                        <span className="text-xs text-slate-400">{user?.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {errors?.email && (
                <span className="text-xs text-red-500">{errors?.email?.message}</span>
              )}
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-500">{tb('username')}</label>
              <Input
                placeholder={tb('usernamePlaceholder')}
                error={!!errors?.username}
                {...register('username', { required: tb('errors.usernameRequired') })}
              />
              {errors?.username && (
                <span className="text-xs text-red-500">{errors?.username?.message}</span>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-500">{tb('phone')}</label>
              <Controller
                name="phone"
                control={control}
                rules={{
                  validate: (v) => isValidPhone998(v) || tb('errors.phoneInvalid'),
                }}
                render={({ field }) => (
                  <Input
                    type="tel"
                    placeholder={tb('phonePlaceholder')}
                    error={!!errors?.phone}
                    value={field?.value}
                    onChange={(e) => field?.onChange(formatPhone998(e.target.value))}
                  />
                )}
              />
              {errors?.phone && (
                <span className="text-xs text-red-500">{errors?.phone?.message}</span>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2.5 mt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="px-5 py-2 bg-white text-slate-500 border border-gray-300 rounded-lg text-sm font-medium hover:border-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {tc('cancel')}
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="px-5 py-2 bg-[#0E73F6] text-white rounded-lg text-sm font-semibold hover:bg-[#0b5fd4] transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
          >
            {isCreating && <Loader size={14} className="animate-spin" />}
            {isCreating ? tc('saving') : initial ? tc('save') : tc('create')}
          </button>
        </div>
      </form>
    </CustomModal>
  )
}

export default BranchModal

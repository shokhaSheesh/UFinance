'use client'

import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '@/components/shared/CustomDialog'
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
    <CustomDialog open={open} onClose={onClose} contentClass="w-[520px] overflow-visible">
      <form onSubmit={handleSubmit(onFormSubmit)} className="flex min-h-0 flex-col">
        <DialogHeader title={initial ? tb('edit') : tb('create')} onClose={onClose} />
        <DialogBody className="flex flex-col gap-4 overflow-visible">
          {/* Branch name */}
          <FormRow label={tb('name')} error={errors?.name?.message}>
            <Input
              placeholder={tb('namePlaceholder')}
              error={!!errors?.name}
              {...register('name', { required: tb('errors.nameRequired') })}
            />
          </FormRow>

          {!initial?.name && (
            <>
              {/* Email with user search */}
              <FormRow label={tb('email')} error={errors?.email?.message}>
                <div className="relative" ref={dropdownRef}>
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
              </FormRow>

              {/* Username */}
              <FormRow label={tb('username')} error={errors?.username?.message}>
                <Input
                  placeholder={tb('usernamePlaceholder')}
                  error={!!errors?.username}
                  {...register('username', { required: tb('errors.usernameRequired') })}
                />
              </FormRow>

              {/* Phone */}
              <FormRow label={tb('phone')} error={errors?.phone?.message}>
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
              </FormRow>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <button type="button" onClick={onClose} disabled={isCreating} className="secondary-btn h-9">
            {tc('cancel')}
          </button>
          <button type="submit" disabled={isCreating} className="primary-btn">
            {isCreating && <Loader size={14} className="animate-spin" />}
            {isCreating ? tc('saving') : initial ? tc('save') : tc('create')}
          </button>
        </DialogFooter>
      </form>
    </CustomDialog>
  )
}

export default BranchModal

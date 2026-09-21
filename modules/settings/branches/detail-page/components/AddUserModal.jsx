'use client'

import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '@/components/shared/CustomDialog'
import Input from '@/components/shared/Input'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { Loader } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const AddUserModal = ({
  open,
  onClose,
  editingUser,
  selectedUser,
  setSelectedUser,
  emailSearch,
  setEmailSearch,
  companyUsers,
  usersLoading,
  rolesData,
  setRoleSearch,
  onSubmit,
  isPending,
  tb,
  tc,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      user_id: '',
      roles_id: '',
      name: '',
      email: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (!open) {
      reset()
      setDropdownOpen(false)
      return
    }
    if (editingUser) {
      setValue('email', editingUser?.user_email || '')
      setValue('name', editingUser?.user_name || '')
      setValue('phone', editingUser?.user_phone || '')
      setValue('role_id', editingUser?.role_id || '')
    } else {
      reset()
    }
  }, [open, editingUser, reset, setValue])

  const submitHandler = (data) => {
    onSubmit?.(data, () => reset())
  }

  return (
    <CustomDialog open={open} onClose={onClose} contentClass="w-[560px] overflow-visible">
      <form onSubmit={handleSubmit(submitHandler)} className="flex min-h-0 flex-col">
        <DialogHeader
          title={
            editingUser
              ? tb?.('editStaff') || 'Редактировать сотрудника'
              : tb?.('addStaff') || 'Добавить сотрудника'
          }
          onClose={onClose}
        />
        <DialogBody className="flex flex-col gap-4 overflow-visible">
          <FormRow label={tb?.('staff.email')} required error={errors?.email?.message}>
            <div className="relative">
              {(() => {
                const { ref, name } = register('email', {
                  required: tb?.('errors.emailRequired'),
                  pattern: { value: EMAIL_RE, message: tb?.('errors.emailInvalid') },
                })
                return (
                  <Input
                    ref={ref}
                    name={name}
                    type="email"
                    placeholder={tb?.('emailPlaceholder')}
                    hasError={!!errors?.email}
                    value={emailSearch}
                    readOnly={!!editingUser}
                    onChange={(e) => {
                      setEmailSearch?.(e.target.value)
                      setValue('email', e.target.value)
                      setSelectedUser?.(null)
                      setDropdownOpen(true)
                    }}
                    onFocus={() => emailSearch?.length >= 2 && setDropdownOpen(true)}
                  />
                )
              })()}
              {usersLoading && emailSearch?.length >= 2 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader size={14} className="animate-spin text-slate-400" />
                </span>
              )}
              {dropdownOpen && companyUsers?.length > 0 && !editingUser && (
                <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto py-1">
                  {companyUsers?.map((user) => (
                    <li
                      key={user?.guid}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSelectedUser?.(user)
                        setEmailSearch?.(user?.email || '')
                        setValue('email', user?.email || '', { shouldValidate: true })
                        setValue('name', user?.name || user?.username || '')
                        setValue('phone', user?.phone || '')
                        setDropdownOpen(false)
                      }}
                      className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer flex flex-col"
                    >
                      <span className="font-medium">
                        {user?.name || user?.username || '—'}
                      </span>
                      <span className="text-xs text-slate-400">{user?.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </FormRow>
          <FormRow label={tb?.('staff.name')} required>
            <Input
              placeholder={tb?.('usernamePlaceholder')}
              hasError={!!errors?.name}
              disabled={!!editingUser}
              {...register('name', { required: true })}
            />
          </FormRow>
          <FormRow label={tb?.('staff.phone')}>
            <Input
              placeholder={tb?.('phonePlaceholder')}
              disabled={!!editingUser}
              {...register('phone')}
            />
          </FormRow>
          <FormRow
            label={tb?.('staff.role')}
            required
            error={errors?.role_id ? tb?.('errors.roleRequired') || 'Выберите роль' : undefined}
          >
            <Controller
              name="role_id"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <SingleSelect
                  data={rolesData}
                  value={field.value}
                  onSearch={(value) => setRoleSearch?.(value)}
                  onChange={field.onChange}
                  className={'bg-white!'}
                />
              )}
            />
          </FormRow>
        </DialogBody>
        <DialogFooter>
          <button type="button" onClick={onClose} className="secondary-btn h-9">
            {tc?.('cancel')}
          </button>
          <button type="submit" disabled={isPending} className="primary-btn">
            {isPending
              ? tc?.('saving')
              : editingUser
                ? tc?.('save')
                : tc?.('add')}
          </button>
        </DialogFooter>
      </form>
    </CustomDialog>
  )
}

export default AddUserModal

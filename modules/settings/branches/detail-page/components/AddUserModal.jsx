'use client'

import CustomDialog from '@/components/shared/CustomDialog'
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
    <CustomDialog open={open} onClose={onClose}>
      <div className="p-6 w-[400px]">
        <h2 className="text-lg font-semibold mb-4">
          {editingUser
            ? tb?.('editStaff') || 'Редактировать сотрудника'
            : tb?.('addStaff') || 'Добавить сотрудника'}
        </h2>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tb?.('staff.email')} *
            </label>
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
              <span className="absolute right-3 top-[34px]">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tb?.('staff.name')} *
            </label>
            <Input
              placeholder={tb?.('usernamePlaceholder')}
              hasError={!!errors?.name}
              disabled={!!editingUser}
              {...register('name', { required: true })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tb?.('staff.phone')}
            </label>
            <Input
              placeholder={tb?.('phonePlaceholder')}
              disabled={!!editingUser}
              {...register('phone')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tb?.('staff.role')} *
            </label>
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
            {errors?.role_id && (
              <span className="text-xs text-red-500">
                {tb?.('errors.roleRequired') || 'Выберите роль'}
              </span>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              {tc?.('cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0E73F6] rounded-md hover:bg-[#0b5fd4] transition-colors disabled:opacity-50"
            >
              {isPending
                ? tc?.('saving')
                : editingUser
                  ? tc?.('save')
                  : tc?.('add')}
            </button>
          </div>
        </form>
      </div>
    </CustomDialog>
  )
}

export default AddUserModal

'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import Input from '@/components/shared/Input'
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { debounce } from 'lodash'
import { Loader, Pencil, Plus, Trash2 } from 'lucide-react'
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import SingleSelect from '../../../../../components/shared/Selects/SingleSelect'
import { useUcodeRequestQuery } from '../../../../../hooks/useDashboard'
import { apiClient } from "../../../../../lib/api/ucode/base"
import { showErrorNotification, showSuccessNotification } from '../../../../../lib/utils/notifications'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const BranchStuffList = () => {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [emailSearch, setEmailSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [roleSearch, setRoleSearch] = useState('')

  const debouncedRoleSearch = useMemo(() => debounce((value) => setRoleSearch(value), 400), [])

  const { data: rolesData, isLoading: rolesLoading, refetch: refetchRoles } = useQuery({
    queryKey: ['get_roles_list'],
    queryFn: () => apiClient.invokeFunction({
      method: 'get_roles',
      data: { page: 1, limit: 150, search: roleSearch },
      type: "role"
    }),
    select: (data) => data?.data?.data?.items?.map(item => ({ value: item.guid, label: item.name })) || [],
    refetchOnMount: true,
  })

  const { data: branchUsers, isLoading } = useQuery({
    queryKey: ['get_branch_users', id],
    queryFn: () => apiClient.invokeFunction({
      method: 'get_branch_users', data: {
        branches_id: id
      }, type: "role"
    }),
    enabled: !!id,
    refetchOnMount: true,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false
  })

  const usersList = branchUsers?.data?.data?.items || []

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm({
    defaultValues: {
      user_id: '',
      roles_id: '',
      name: '',
      email: '',
      phone: ''
    }
  })

  // Debounced email search
  const debouncedEmailSearch = useMemo(() => debounce((value) => setEmailSearch(value), 400), [])


  useEffect(() => {
    debouncedEmailSearch(emailSearch)
    return () => debouncedEmailSearch.cancel()
  }, [emailSearch, debouncedEmailSearch])

  useEffect(() => {
    debouncedRoleSearch(roleSearch)
    return () => debouncedRoleSearch.cancel()
  }, [roleSearch, debouncedRoleSearch])

  const { data: usersData, isFetching: usersLoading } = useUcodeRequestQuery({
    method: 'get_company_users',
    data: { page: 1, limit: 20, search: emailSearch },
    skip: emailSearch.length < 2 || !!editingUser,
  })

  const companyUsers = usersData?.data?.data?.response || []

  const createUserMutation = useMutation({
    mutationFn: (data) => apiClient.invokeFunction({
      method: 'create_branch_user',
      data: {
        branch_id: id,
        ...data
      },
      type: "role"
    }),
    onSuccess: () => {
      showSuccessNotification('Пользователь успешно добавлен')
      queryClient.invalidateQueries({ queryKey: ['get_branch_users', id] })
      setIsModalOpen(false)
      reset()
    },
    onError: (error) => {
      showErrorNotification(error?.message || 'Ошибка при добавлении пользователя')
    }
  })

  const updateUserMutation = useMutation({
    mutationFn: (data) => apiClient.invokeFunction({
      method: 'update_branch_user',
      data,
      type: "role"
    }),
    onSuccess: () => {
      showSuccessNotification('Пользователь успешно обновлен')
      queryClient.invalidateQueries({ queryKey: ['get_branch_users', id] })
      setIsModalOpen(false)
      setEditingUser(null)
      reset()
    },
    onError: (error) => {
      showErrorNotification(error?.message || 'Ошибка при обновлении пользователя')
    }
  })

  const deleteUserMutation = useMutation({
    mutationFn: (guid) => apiClient.invokeFunction({
      method: 'delete_branch_user',
      data: { guid },
      type: "role"
    }),
    onSuccess: () => {
      showSuccessNotification('Пользователь успешно удален')
      queryClient.invalidateQueries({ queryKey: ['get_branch_users', id] })
      setUserToDelete(null)
    },
    onError: (error) => {
      showErrorNotification(error?.message || 'Ошибка при удалении пользователя')
    }
  })

  const onSubmit = (data) => {
    if (editingUser) {
      // When editing, only send guid and role_id
      updateUserMutation.mutate({
        guid: editingUser.guid,
        role_id: data?.role_id
      })
    } else {
      // When creating, send full payload
      const payload = {
        branches_id: id,
        name: data?.name,
        email: selectedUser?.email || data?.email || '',
        phone: data?.phone,
        role_id: data?.role_id
      }
      if (selectedUser) {
        payload.user_id = selectedUser?.guid
      }
      createUserMutation.mutate(payload)
    }
  }

  const handleCreate = () => {
    setEditingUser(null)
    setSelectedUser(null)
    setEmailSearch('')
    setDropdownOpen(false)
    setRoleSearch('')
    reset()
    setIsModalOpen(true)
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setEmailSearch(user.user_email || '')
    setSelectedUser({
      guid: user.user_id,
      email: user.user_email,
      name: user.user_name,
      phone: user.user_phone,
      role_id: user.roles_id
    })
    setValue('email', user.user_email || '')
    setValue('name', user.user_name || '')
    setValue('phone', user.user_phone || '')
    setValue('role_id', user.role_id || '')
    setIsModalOpen(true)
  }

  const handleDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.guid)
    }
  }

  const isPending = createUserMutation.isPending || updateUserMutation.isPending || deleteUserMutation.isPending

  return (
    <div className="p-4 flex-1 bg-white">
      <div className="flex justify-start gap-2 items-center mb-6">
        <h1 className="text-xl font-bold text-slate-900">Сотрудники филиала</h1>
        <button
          onClick={handleCreate}
          className="flex items-center primary-btn"
        >
          <Plus size={18} />
          Добавить
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader size={24} className="animate-spin text-[#0E73F6]" />
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#344054] border-b">Имя</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#344054] border-b">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#344054] border-b">Телефон</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#344054] border-b">Роль</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-[#344054] border-b w-[100px]">Действия</th>
            </tr>
          </thead>
          <tbody>
            {usersList?.map((user) => (
              <tr key={user.guid} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-[#344054] border-b">{user.user_name}</td>
                <td className="px-4 py-3 text-sm text-[#344054] border-b">{user.user_email}</td>
                <td className="px-4 py-3 text-sm text-[#344054] border-b">{user.user_phone}</td>
                <td className="px-4 py-3 text-sm text-[#344054] border-b">{user.role_name || user.roles_id}</td>
                <td className="px-4 py-3 text-sm border-b">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-1.5 text-gray-500 hover:text-[#0E73F6] hover:bg-gray-100 rounded transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setUserToDelete(user)}
                      className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {usersList?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Нет сотрудников
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Create/Edit Modal */}
      <CustomDialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 w-[400px]">
          <h2 className="text-lg font-semibold mb-4">
            {editingUser ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              {(() => {
                const { ref, name } = register('email', {
                  required: 'Введите email',
                  pattern: { value: EMAIL_RE, message: 'Неверный формат email' },
                })
                return (
                  <Input
                    ref={ref}
                    name={name}
                    type="email"
                    placeholder="example@mail.com"
                    hasError={!!errors.email}
                    value={emailSearch}
                    readOnly={!!editingUser}
                    onChange={e => {
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
                <span className="absolute right-3 top-[34px]">
                  <Loader size={14} className="animate-spin text-slate-400" />
                </span>
              )}
              {dropdownOpen && companyUsers.length > 0 && !editingUser && (
                <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto py-1">
                  {companyUsers.map(user => (
                    <li
                      key={user.guid}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        setSelectedUser(user)
                        setEmailSearch(user.email || '')
                        setValue('email', user.email || '', { shouldValidate: true })
                        setValue('name', user.name || user.username || '')
                        setValue('phone', user.phone || '')
                        setDropdownOpen(false)
                      }}
                      className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer flex flex-col"
                    >
                      <span className="font-medium">{user.name || user.username || '—'}</span>
                      <span className="text-xs text-slate-400">{user.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
              <Input
                placeholder="Введите имя"
                hasError={!!errors.name}
                disabled={!!editingUser}
                {...register('name', { required: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
              <Input
                placeholder="Введите телефон"
                disabled={!!editingUser}
                {...register('phone')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Роли *</label>
              <Controller
                name='role_id'
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                  return <SingleSelect
                    data={rolesData}
                    value={field.value}
                    onSearch={(value) => setRoleSearch(value)}
                    onChange={field.onChange}
                    className={'bg-white!'}
                  />
                }}
              />
              {errors.role_id && <span className="text-xs text-red-500">Выберите роль</span>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0E73F6] rounded-md hover:bg-[#0b5fd4] transition-colors disabled:opacity-50"
              >
                {isPending ? 'Сохранение...' : (editingUser ? 'Сохранить' : 'Добавить')}
              </button>
            </div>
          </form>
        </div>
      </CustomDialog>

      {/* Delete Confirmation */}
      <CustomDialog open={!!userToDelete} onClose={() => setUserToDelete(null)}>
        <div className="p-6 w-[350px]">
          <h2 className="text-lg font-semibold mb-2">Подтверждение удаления</h2>
          <p className="text-sm text-gray-600 mb-6">
            Вы уверены, что хотите удалить сотрудника &quot;{userToDelete?.name}&quot;?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setUserToDelete(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteUserMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deleteUserMutation.isPending ? 'Удаление...' : 'Удалить'}
            </button>
          </div>
        </div>
      </CustomDialog>
    </div>
  )
}

export default BranchStuffList
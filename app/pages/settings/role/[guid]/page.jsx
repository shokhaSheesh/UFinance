'use client'

import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import Input from '@/components/shared/Input'
import { queryClient } from '@/lib/queryClient'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { apiClient } from '../../../../../lib/api/ucode/base'

const PERMISSIONS_DATA = [
  { id: 'indicators', label: 'Показатели', hasSubmenu: false, allowedActions: ['read'], menuId: null },
  {
    id: 'operations',
    label: 'Операции',
    hasSubmenu: true,
    allowedActions: ['read', 'add', 'edit', 'delete'],
    menuId: null,
    children: [
      { id: 'income', label: 'Поступление', menuId: null },
      { id: 'payout', label: 'Выплата', menuId: null },
      { id: 'transfer', label: 'Перемещение', menuId: null },
      { id: 'accrual', label: 'Начисление', menuId: null },
      { id: 'shipment', label: 'Отгрузка', menuId: null },
    ],
  },
  { id: 'deals', label: 'Сделки', hasSubmenu: false, allowedActions: ['read', 'add', 'edit', 'delete'], menuId: null },
  {
    id: 'reports',
    label: 'Отчёты',
    hasSubmenu: true,
    allowedActions: ['read', 'add', 'edit', 'delete'],
    menuId: null,
    children: [
      { id: 'cashflow', label: 'Движение денег (ДДС)', menuId: null },
      { id: 'pnl', label: 'Прибыли и убытки (ОПУ)', menuId: null },
      { id: 'balance', label: 'Баланс', menuId: null },
    ],
  },
  {
    id: 'directories',
    label: 'Справочники',
    hasSubmenu: true,
    allowedActions: ['read', 'add', 'edit', 'delete'],
    menuId: null,
    children: [
      { id: 'counterparties', label: 'Контрагенты', menuId: null },
      { id: 'categories', label: 'Учётные статьи', menuId: null },
      { id: 'accounts', label: 'Мои счета', menuId: null },
      { id: 'legalentities', label: 'Мои юрлица', menuId: null },
      { id: 'productsServices', label: 'Товары и услуги', menuId: null },
    ],
  },
  {
    id: 'settings',
    label: 'Настройки',
    hasSubmenu: true,
    allowedActions: ['read', 'add', 'edit', 'delete'],
    menuId: null,
    children: [
      { id: 'general', label: 'Общие настройки', menuId: null },
      { id: 'users', label: 'Пользователи', menuId: null },
      { id: 'profile', label: 'Мой профиль', menuId: null },
      { id: 'exchangerates', label: 'Курсы валют', menuId: null },
    ],
  },
]

const CreateRole = () => {
  const router = useRouter()
  const { guid } = useParams()
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      roleName: '',
      permissions: {
        indicators: { read: false },
        operations: {
          income: { read: false, add: false, edit: false, delete: false },
          payout: { read: false, add: false, edit: false, delete: false },
          transfer: { read: false, add: false, edit: false, delete: false },
          accrual: { read: false, add: false, edit: false, delete: false },
          shipment: { read: false, add: false, edit: false, delete: false },
        },
        deals: { read: false, add: false, edit: false, delete: false },
        reports: {
          cashflow: { read: false, add: false, edit: false, delete: false },
          pnl: { read: false, add: false, edit: false, delete: false },
          balance: { read: false, add: false, edit: false, delete: false },
        },
        directories: {
          counterparties: { read: false, add: false, edit: false, delete: false },
          transactionCategories: { read: false, add: false, edit: false, delete: false },
          accounts: { read: false, add: false, edit: false, delete: false },
          legalentities: { read: false, add: false, edit: false, delete: false },
          productsServices: { read: false, add: false, edit: false, delete: false },
        },
        settings: {
          general: { read: false, add: false, edit: false, delete: false },
          users: { read: false, add: false, edit: false, delete: false },
          profile: { read: false, add: false, edit: false, delete: false },
          exchangerates: { read: false, add: false, edit: false, delete: false },
        },
      }
    }
  })


  const { data: rolePermission, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['get_role_permissions', guid],
    queryFn: () => apiClient.invokeFunction({
      method: 'get_role_permissions', data: {
        role_id: guid
      },
      type: 'role'
    }),
    select: (role) => role?.data?.data?.role_permissions,
    enabled: !!guid,
    staleTime: 1000 * 60,
    cacheTime: 1000 * 60
  })

  const { mutateAsync: updateRolePermissions, isPending: isUpdating } = useMutation({
    mutationKey: ['update_role_permissions'],
    mutationFn: (data) => apiClient.invokeFunction({
      method: 'update_role_permissions',
      data,
      type: 'role'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get_role_permissions', guid] })
    }
  })

  // Pre-populate form with fetched permissions
  useEffect(() => {
    if (rolePermission && rolePermission.length > 0) {
      const permissionData = rolePermission[0]

      // Set role name
      if (permissionData.role_name) {
        setValue('roleName', permissionData.role_name)
      }

      // Process permissions and set form values
      const processPermissions = (permissions) => {
        const formPermissions = {}

        permissions.forEach((perm) => {
          const menuSlug = perm.menu_slug

          if (perm.children && perm.children.length > 0) {
            // Parent menu with children
            formPermissions[menuSlug] = {}
            perm.children.forEach((child) => {
              formPermissions[menuSlug][child.menu_slug] = {
                read: child.read || false,
                add: child.write || false,
                edit: child.update || false,
                delete: child.delete || false,
              }
            })
          } else {
            // Single permission (no children)
            formPermissions[menuSlug] = {
              read: perm.read || false,
              add: perm.write || false,
              edit: perm.update || false,
              delete: perm.delete || false,
            }
          }
        })

        return formPermissions
      }

      const formPermissions = processPermissions(permissionData.permissions || [])
      setValue('permissions', formPermissions)
    }
  }, [rolePermission, setValue])

  // Watch permissions to update checkbox UI
  const permissions = watch('permissions') || {}

  const handleCheckboxChange = (id, action, parentId = null) => {
    if (parentId) {
      const currentValue = permissions[parentId]?.[id]?.[action] || false
      setValue(`permissions.${parentId}.${id}.${action}`, !currentValue)
    } else {
      const currentValue = permissions[id]?.[action] || false
      setValue(`permissions.${id}.${action}`, !currentValue)
    }
  }

  const handleParentCheckboxChange = (parent, action) => {
    const currentValue = permissions[parent.id]?.[action] || false
    const newValue = !currentValue

    setValue(`permissions.${parent.id}.${action}`, newValue)

    if (parent.children) {
      parent.children.forEach((child) => {
        setValue(`permissions.${parent.id}.${child.id}.${action}`, newValue)
      })
    }
  }

  const onSubmit = async (data) => {
    if (!guid) return

    // Build nested permissions structure for API
    const buildPermissionsPayload = (permissionsData) => {
      return PERMISSIONS_DATA.map((parent) => {
        const parentPerm = permissionsData[parent.id]

        if (parent.children && parent.children.length > 0) {
          // Parent with children - build children array
          const children = parent.children.map((child) => {
            const childPerm = parentPerm?.[child.id] || {}
            return {
              menu_id: child.menuId || null,
              read: childPerm.read || false,
              write: childPerm.add || false,
              update: childPerm.edit || false,
              delete: childPerm.delete || false,
            }
          })

          return {
            menu_id: parent.menuId || null,
            read: false,
            write: false,
            update: false,
            delete: false,
            children,
          }
        } else {
          // Single permission (no children)
          return {
            menu_id: parent.menuId || null,
            read: parentPerm?.read || false,
            write: parentPerm?.add || false,
            update: parentPerm?.edit || false,
            delete: parentPerm?.delete || false,
            children: [],
          }
        }
      })
    }

    const payload = {
      role_id: guid,
      role_name: data.roleName,
      permissions: buildPermissionsPayload(data.permissions),
    }

    await updateRolePermissions(payload)
    router.back()
  }

  const renderRow = (item, isChild = false, parent = null) => {
    const id = item.id
    const actions = ['read', 'add', 'edit', 'delete']
    const isActionAllowed = (action) => {
      if (isChild) return true
      return item.allowedActions?.includes(action)
    }

    const isActionDisabled = (action) => {
      // Operations children edit column is always disabled
      if (isChild && parent?.id === 'operations' && action === 'edit') {
        return true
      }
      if (!isChild) return false
      if (!parent) return false
      // Child is disabled if parent column is not checked
      return !permissions[parent.id]?.[action]
    }

    const getCheckedValue = (action) => {
      if (isChild && parent) {
        return !!permissions[parent.id]?.[id]?.[action]
      }
      return !!permissions[id]?.[action]
    }

    return (
      <tr key={id} className={cn('bg-white', isChild ? '' : 'font-medium')}>
        <td className={cn('px-4 py-3 text-sm text-[#344054] border-b border-[#f2f4f7]', isChild ? 'pl-10' : '')}>
          {!isChild ? item.label : ''}
        </td>
        <td className="px-4 py-3 text-sm text-[#344054] border-b border-[#f2f4f7]">
          {isChild ? item.label : ''}
        </td>
        {actions.map((action) => (
          <td key={action} className="px-4 py-3 text-sm text-[#344054] border-b border-[#f2f4f7] text-center w-[100px]">
            {isActionAllowed(action) && (
              <div className="flex justify-center items-center">
                <OperationCheckbox
                  disabled={isActionDisabled(action)}
                  checked={getCheckedValue(action)}
                  onChange={() => {
                    if (isActionDisabled(action)) return

                    if (item.children) {
                      handleParentCheckboxChange(item, action)
                    } else if (isChild && parent) {
                      handleCheckboxChange(id, action, parent.id)
                    } else {
                      handleCheckboxChange(id, action)
                    }
                  }}
                />
              </div>
            )}
          </td>
        ))}
      </tr>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className=" bg-white w-full h-full flex flex-col overflow-auto"
    >
      {/* Header Section */}
      <h1 className="text-[18px] p-4 font-semibold text-[#1a1a1a] m-0 sticky top-0 z-10 bg-white">Добавить новую должность</h1>
      <div className="flex items-center gap-5 mb-[30px] p-4">
        <h1 className="text-sm  text-[#1a1a1a] m-0">Должности</h1>
        <div className="w-[320px]">
          <Input
            placeholder="Введите название"
            hasError={!!errors.roleName}
            {...register('roleName', { required: true })}
          />
          {errors.roleName && <span className="text-xs text-red-500">Это поле обязательно</span>}
        </div>
      </div>

      {/* Permissions Table — Scrollable Table Wrapper */}
      <div className="w-fit rounded-[8px] mx-4 mb-[30px]">
        {isLoadingPermissions && (
          <div className="flex items-center justify-center py-8">
            <Loader size={24} className="animate-spin text-primary" />
            <span className="ml-2 text-sm text-gray-500">Загрузка разрешений...</span>
          </div>
        )}
        <table className="w-fit border-collapse">
          <thead className="bg-gray-ucode-50">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">Меню</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">Подменю</th>
              <th className="px-4 py-3 text-center w-[100px] text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">Читать</th>
              <th className="px-4 py-3 text-center w-[100px] text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">Добавить</th>
              <th className="px-4 py-3 text-center w-[100px] text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">Редактировать</th>
              <th className="px-4 py-3 text-center w-[100px] text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">Удалить</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS_DATA.map((item) => (
              <React.Fragment key={item.id}>
                {renderRow(item)}
                {item.children?.map((child) => renderRow(child, true, item))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="flex  justify-end gap-[12px] mt-auto pt-[20px]">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => router.back()}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="primary-btn"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader size={14} className="animate-spin" />
                Сохранение...
              </>
            ) : (
              'Сохранить'
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

// Utility to merge classNames
function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default CreateRole
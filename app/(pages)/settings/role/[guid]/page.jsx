'use client'

import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { queryClient } from '@/lib/queryClient'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { apiClient } from '../../../../../lib/api/ucode/base'

const getPermissionsData = (t) => [
  { id: 'indicators', label: t('permissions.sections.indicators'), hasSubmenu: false, allowedActions: ['read'], menuId: null },
  {
    id: 'operations',
    label: t('permissions.sections.operations'),
    hasSubmenu: true,
    allowedActions: ['read', 'add', 'edit', 'delete'],
    menuId: null,
    children: [
      { id: 'income', label: t('permissions.sections.income'), menuId: null },
      { id: 'expense', label: t('permissions.sections.expense'), menuId: null },
      { id: 'transfer', label: t('permissions.sections.transfer'), menuId: null },
      { id: 'accrual', label: t('permissions.sections.accrual'), menuId: null },
      { id: 'shipment', label: t('permissions.sections.shipment'), menuId: null },
    ],
  },
  { id: 'deals', label: t('permissions.sections.deals'), hasSubmenu: false, allowedActions: ['read', 'add', 'edit', 'delete'], menuId: null },
  {
    id: 'reports',
    label: t('permissions.sections.reports'),
    hasSubmenu: true,
    allowedActions: ['read', 'add', 'edit', 'delete'],
    menuId: null,
    children: [
      { id: 'cash_flow', label: t('permissions.sections.cash_flow'), menuId: null },
      { id: 'p_and_l', label: t('permissions.sections.p_and_l'), menuId: null },
      { id: 'balance', label: t('permissions.sections.balance'), menuId: null },
      { id: 'students_report', label: t('permissions.sections.students_report'), menuId: null },
    ],
  },
  {
    id: 'directories',
    label: t('permissions.sections.directories'),
    hasSubmenu: true,
    allowedActions: ['read', 'add', 'edit', 'delete'],
    menuId: null,
    children: [
      { id: 'counterparties', label: t('permissions.sections.counterparties'), menuId: null },
      { id: 'accounting_items', label: t('permissions.sections.accounting_items'), menuId: null },
      { id: 'my_accounts', label: t('permissions.sections.my_accounts'), menuId: null },
      { id: 'my_entities', label: t('permissions.sections.my_entities'), menuId: null },
      { id: 'products_and_services', label: t('permissions.sections.products_and_services'), menuId: null },
    ],
  },
  {
    id: 'settings',
    label: t('permissions.sections.settings'),
    hasSubmenu: true,
    allowedActions: ['read', 'add', 'edit', 'delete'],
    menuId: null,
    children: [
      { id: 'general_settings', label: t('permissions.sections.general_settings'), menuId: null },
      { id: 'my_profile', label: t('permissions.sections.my_profile'), menuId: null },
      { id: 'branches', label: t('permissions.sections.branches'), menuId: null },
      { id: 'exchange_rates', label: t('permissions.sections.exchange_rates'), menuId: null },
      { id: 'users', label: t('permissions.sections.users'), menuId: null },
    ],
  },
]

const CreateRole = () => {
  const router = useRouter()
  const { guid } = useParams()
  const searchParams = useSearchParams()
  const roleName = searchParams.get('role_name') || ''
  const tr = useTranslations('Settings.roles')
  const tc = useTranslations('Settings.common')
  // Store menu_id mapping from fetched permissions
  const [menuIdMap, setMenuIdMap] = React.useState({})

  const PERMISSIONS_DATA = useMemo(() => getPermissionsData(tr), [tr])

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

  // Process API permissions into form structure and build menu_id map
  const { defaultValues, menuIdMap: initialMenuIdMap } = useMemo(() => {
    if (!rolePermission) {
      return { defaultValues: null, menuIdMap: {} }
    }

    const menuMap = {}
    const formPermissions = {}

    // Process each permission from API
    rolePermission?.forEach((perm) => {
      const menuSlug = perm.menu_slug

      // Store menu_id, guid, menu_slug, menu_name for parent
      menuMap[menuSlug] = {
        menu_id: perm.menu_id,
        guid: perm.guid,
        menu_slug: perm.menu_slug,
        menu_name: perm.menu_name
      }

      if (perm.children && perm.children.length > 0) {
        // Parent with children - store parent permissions AND children
        formPermissions[menuSlug] = {
          read: perm.read || false,
          add: perm.write || false,
          edit: perm.update || false,
          delete: perm.delete || false,
        }
        perm.children.forEach((child) => {
          menuMap[`${menuSlug}.${child.menu_slug}`] = {
            menu_id: child.menu_id,
            guid: child.guid,
            menu_slug: child.menu_slug,
            menu_name: child.menu_name
          }

          formPermissions[menuSlug][child.menu_slug] = {
            read: child.read || false,
            add: child.write || false,
            edit: child.update || false,
            delete: child.delete || false,
          }
        })
      } else {
        // Single permission (no children) - flat structure
        formPermissions[menuSlug] = {
          read: perm.read || false,
          add: perm.write || false,
          edit: perm.update || false,
          delete: perm.delete || false,
        }
      }
    })

    return {
      defaultValues: {
        permissions: formPermissions
      },
      menuIdMap: menuMap
    }
  }, [rolePermission])


  // Sync menuIdMap to state when it changes
  useEffect(() => {
    if (Object.keys(initialMenuIdMap).length > 0) {
      setMenuIdMap(initialMenuIdMap)
    }
  }, [initialMenuIdMap])

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: defaultValues || {
      permissions: {}
    },
    values: defaultValues
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
        // Get actual menu_id from fetched data, fallback to null
        const parentMenuId = menuIdMap[parent.id] || null

        if (parent.children && parent.children.length > 0) {
          // Parent with children - build children array
          const children = parent.children.map((child) => {
            const childPerm = parentPerm?.[child.id] || {}
            // Get actual menu_id for child from fetched data
            const childMenuId = menuIdMap[`${parent.id}.${child.id}`] || null
            return {
              ...childMenuId,
              read: childPerm.read || false,
              write: childPerm.add || false,
              update: childPerm.edit || false,
              delete: childPerm.delete || false,
            }
          })

          return {
            ...parentMenuId,
            read: parentPerm?.read || false,
            write: parentPerm?.add || false,
            update: parentPerm?.edit || false,
            delete: parentPerm?.delete || false,
            children,
          }
        } else {
          // Single permission (no children)
          return {
            ...parentMenuId,
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
      role_permissions: buildPermissionsPayload(data.permissions),
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
      // if (isChild && parent?.id === 'operations' && action === 'edit') {
      //   return true
      // }
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
      <h1 className="text-[18px] p-4 font-semibold text-[#1a1a1a] m-0 sticky top-0 z-10 bg-white">
        {tr('permissions.title')} {roleName}
      </h1>
      {/* Permissions Table — Scrollable Table Wrapper */}
      <div className="w-fit rounded-[8px] mx-4 mb-[30px]">
        {isLoadingPermissions && (
          <div className="flex items-center justify-center py-8">
            <Loader size={24} className="animate-spin text-primary" />
            <span className="ml-2 text-sm text-gray-500">{tc('loading')}...</span>
          </div>
        )}
        <table className="w-fit border-collapse">
          <thead className="bg-gray-ucode-50">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">{tr('permissions.menu') || 'Меню'}</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">{tr('permissions.submenu') || 'Подменю'}</th>
              <th className="px-4 py-3 text-center w-[100px] text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">{tr('permissions.read')}</th>
              <th className="px-4 py-3 text-center w-[100px] text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">{tr('permissions.add')}</th>
              <th className="px-4 py-3 text-center w-[100px] text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">{tr('permissions.edit')}</th>
              <th className="px-4 py-3 text-center w-[100px] text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">{tr('permissions.delete')}</th>
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
            {tc('cancel')}
          </button>
          <button
            type="submit"
            className="primary-btn"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <div className='flex items-center gap-2'>
                <Loader size={14} className="animate-spin" />
                {tc('saving')}...
              </div>
            ) : (
                tc('save')
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
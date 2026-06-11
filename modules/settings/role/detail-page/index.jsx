'use client'

import { Loader } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import PermissionTree from './components/PermissionTree'
import RoleDetailActions from './components/RoleDetailActions'
import RoleDetailHeader from './components/RoleDetailHeader'
import { usePermissionTree } from './hooks/usePermissionTree'
import { useRolePermissions, useUpdateRolePermissions } from './hooks/useRoleDetailData'
import { buildPermissionsPayload, getPermissionsData } from './utils/permissionUtils'

const RoleDetailPage = () => {
  const router = useRouter()
  const { guid } = useParams()
  const searchParams = useSearchParams()
  const roleName = searchParams?.get('role_name') || ''
  const tr = useTranslations('Settings.roles')
  const tc = useTranslations('Settings.common')

  const PERMISSIONS_DATA = useMemo(() => getPermissionsData(tr), [tr])

  const { data: rolePermission, isLoading: isLoadingPermissions } = useRolePermissions(guid)

  const {
    form,
    permissions,
    menuIdMap,
    handleCheckboxChange,
    handleParentCheckboxChange,
  } = usePermissionTree(rolePermission)

  const { mutateAsync: updateRolePermissions, isPending: isUpdating } =
    useUpdateRolePermissions(guid)

  const { handleSubmit } = form

  const onSubmit = async (data) => {
    if (!guid) return

    const payload = {
      role_id: guid,
      role_permissions: buildPermissionsPayload(
        data?.permissions,
        PERMISSIONS_DATA,
        menuIdMap,
      ),
    }

    await updateRolePermissions(payload)
    router.back()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white w-full h-full flex flex-col overflow-auto"
    >
      <RoleDetailHeader title={tr('permissions.title')} roleName={roleName} />

      <div className="w-fit rounded-[8px] mx-4 mb-[30px]">
        {isLoadingPermissions && (
          <div className="flex items-center justify-center py-8">
            <Loader size={24} className="animate-spin text-primary" />
            <span className="ml-2 text-sm text-gray-500">{tc('loading')}...</span>
          </div>
        )}

        <PermissionTree
          permissionsConfig={PERMISSIONS_DATA}
          permissions={permissions}
          onCheckboxChange={handleCheckboxChange}
          onParentCheckboxChange={handleParentCheckboxChange}
          t={tr}
        />

        <RoleDetailActions
          onCancel={() => router.back()}
          isUpdating={isUpdating}
          tc={tc}
        />
      </div>
    </form>
  )
}

export default RoleDetailPage

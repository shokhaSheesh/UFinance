'use client'

import { Loader } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useParams, useSearchParams } from 'next/navigation'
import { useRouter } from '@/hooks/useAppRouter'
import { useMemo, useState } from 'react'
import AccessNewAccounts from './components/AccessNewAccounts'
import AccountPermissions from './components/AccountPermissions'
import DataEditingRestriction from './components/DataEditingRestriction'
import PermissionTree from './components/PermissionTree'
import RoleDetailActions from './components/RoleDetailActions'
import RoleDetailHeader from './components/RoleDetailHeader'
import RoleDetailTabs from './components/RoleDetailTabs'
import { useAccountPermissions } from './hooks/useAccountPermissions'
import { usePermissionTree } from './hooks/usePermissionTree'
import { useRolePermissions, useUpdateRolePermissions } from './hooks/useRoleDetailData'
import { buildAccountPermissionsPayload } from './utils/accountPermissionUtils'
import { buildPermissionsPayload, getPermissionsData, mergePermissionsConfig } from './utils/permissionUtils'
import {
  DEFAULT_DATA_EDITING_RESTRICTION,
  RESTRICTION_TYPES,
  mapRestrictionFromApi,
  mapRestrictionToApi,
} from '@/utils/dataEditingRestriction'

const TABS = {
  SECTIONS: 'sections',
  ACCOUNTS: 'accounts',
}

const RoleDetailPage = () => {
  const router = useRouter()
  const { guid } = useParams()
  const searchParams = useSearchParams()
  const roleName = searchParams?.get('role_name') || ''
  const tr = useTranslations('Settings.roles')
  const tc = useTranslations('Settings.common')

  const { data: roleData, isLoading: isLoadingPermissions } = useRolePermissions(guid)
  const rolePermission = roleData?.role_permissions

  const [activeTab, setActiveTab] = useState(TABS.SECTIONS)
  const [restriction, setRestriction] = useState(DEFAULT_DATA_EDITING_RESTRICTION)
  const [restrictionError, setRestrictionError] = useState('')

  const accountPermissions = useAccountPermissions()

  // Подтягиваем сохранённое ограничение, когда роль приехала с бэка.
  // Правка состояния прямо в рендере (а не в эффекте) — рекомендованный способ
  // синхронизировать state с изменившимися данными без лишнего прохода рендера.
  const [loadedRole, setLoadedRole] = useState(null)
  if (roleData && roleData !== loadedRole) {
    setLoadedRole(roleData)
    setRestriction(mapRestrictionFromApi(roleData))
    setRestrictionError('')
    accountPermissions.initFromRole(roleData)
  }

  const PERMISSIONS_DATA = useMemo(
    () => mergePermissionsConfig(getPermissionsData(tr), rolePermission),
    [tr, rolePermission],
  )

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

  const tabs = [
    { key: TABS.SECTIONS, label: tr('tabs.sections') },
    { key: TABS.ACCOUNTS, label: tr('tabs.accounts') },
  ]

  const handleRestrictionChange = (next) => {
    setRestriction(next)
    setRestrictionError('')
  }

  const onSubmit = async (data) => {
    if (!guid) return

    // Бэк вернёт ошибку `allowed_editing_until_date is required` — ловим её раньше
    if (
      restriction?.isRestricted &&
      restriction?.type === RESTRICTION_TYPES.UNTIL_DATE &&
      !restriction?.untilDate
    ) {
      setRestrictionError(tr('restriction.dateRequired'))
      setActiveTab(TABS.SECTIONS)
      return
    }

    const payload = {
      role_id: guid,
      ...mapRestrictionToApi(restriction),
      role_permissions: buildPermissionsPayload(
        data?.permissions,
        PERMISSIONS_DATA,
        menuIdMap,
      ),
      // access_new_accounts бэк перезаписывает на каждом запросе — шлём всегда
      access_new_accounts: !!accountPermissions.accessNewAccounts,
      account_permissions: buildAccountPermissionsPayload(accountPermissions.tree),
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

      {/* Настройки роли общие для обеих вкладок, поэтому живут над табами */}
      <div className="px-4">
        <DataEditingRestriction
          value={restriction}
          onChange={handleRestrictionChange}
          error={restrictionError}
          t={tr}
        />

        <AccessNewAccounts
          checked={accountPermissions.accessNewAccounts}
          onChange={accountPermissions.setAccessNewAccounts}
          t={tr}
        />

        <RoleDetailTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="w-fit rounded-[8px] mx-4 mt-4 mb-[30px]">
        {activeTab === TABS.SECTIONS && (
          <>
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
          </>
        )}

        {activeTab === TABS.ACCOUNTS && (
          <div>
            <AccountPermissions
              tree={accountPermissions.tree}
              onToggleEntity={accountPermissions.toggleEntity}
              onToggleAccount={accountPermissions.toggleAccount}
              isLoading={isLoadingPermissions}
              t={tr}
              tc={tc}
            />
          </div>
        )}

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

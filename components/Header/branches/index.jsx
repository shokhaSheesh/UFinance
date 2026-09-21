'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/hooks/useAppRouter'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import { apiClient } from '../../../lib/api/ucode/base'
import { appStore } from '../../../store/app.store'
import { authStore } from '../../../store/auth.store'

const Branches = observer(() => {
  const t = useTranslations('Header.branches')
  const [open, setOpen] = useState(false)
  const [reloading, setReloading] = useState(false)
  const containerRef = useRef(null)
  const router = useRouter()
  const userData = authStore.userData

  const { mutateAsync: getMyPermissions, isPending: permissionsLoading } = useMutation({
    mutationKey: ['get_my_permissions'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'get_user_role_permissions', data, type: 'role' })
  })

  const { data: branchesData } = useUcodeRequestQuery({
    method: 'get_my_branches',
    data: { page: 1, limit: 200 }
  })

  const { data: permission, isSuccess } = useQuery({
    queryKey: ['get_userPermissions'],
    queryFn: async () => getMyPermissions({
      branches_id: authStore.branch_id,
    }),
    // Кроме прав, ответ несёт закрытый период и доступ к счетам — берём весь `data`
    select: (data) => data?.data?.data,
    enabled: userData?.role === 'employees' && authStore.branches?.length > 0,
    staleTime: 1000 * 60 * 60,
    refetchOnMount: true
  })

  console.log('validation', userData?.role === 'employees' && appStore.branches?.length > 0)
  console.log('role', userData?.role, 'branches', appStore.branches?.length)

  const branches = useMemo(() => branchesData?.data?.data, [branchesData])
  const selectedBranch = authStore.selectBranch

  const branchesList = useMemo(() => {
    return branches?.length <= 1 ? null : branches
  }, [branches])


  if (isSuccess) {
    appStore.setNewPermission(permission?.role_permissions)
    appStore.setDataEditingRestriction(permission)
    appStore.setAccountPermissions(permission)
  }


  useEffect(() => {
    authStore.setBranches(branches)
  }, [branches])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSelectBranch(branch) {
    let permission = {}
    setOpen(false)
    authStore.setBranchId(branch.guid)
    appStore.setBranchIsAccrualDate(branch.guid)
    authStore.setSelectBranch(branch)
    setReloading(true)
    if (userData?.role === 'plan_fakt_admins' && branch?.is_employee) {
      appStore.setEmployerPermission()
    } else if (userData?.role === 'employees') {
      permission = await getMyPermissions({
        branches_id: branch?.guid,
      })
      appStore.setNewPermission(permission?.data?.data?.role_permissions)
      appStore.setDataEditingRestriction(permission?.data?.data)
      appStore.setAccountPermissions(permission?.data?.data)
    } else if (userData?.role === 'plan_fakt_admins' && !branch?.is_employee) {
      appStore.setPlanfactPermission()
    }
    router.push('/operations')
    window.location.reload()
  }



  if (!branchesList) return null

  return (
    <div className="relative " ref={containerRef}>
      {/* {reloading && <ScreenLoader />} */}

      <button
        type="button"
        onClick={() => branchesList && setOpen(prev => !prev)}
        className="flex items-center gap-1.5 px-3 h-9 rounded-lg hover:bg-slate-100 text-sm font-medium text-slate-700 bg-transparent border-none cursor-pointer transition-colors"
      >
        <span className="flex items-center gap-1 text-start line-clamp-1 w-full font-medium">
          {selectedBranch?.name || t('selectPlaceholder')}
          {branchesList && (
            <ChevronDown
              size={14}
              className={`transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
            />
          )}
        </span> 
      </button>

      {open && branchesList && (
        <div className="absolute right-0 top-[110%] z-50! mt-1  w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 overflow-hidden">
          {branchesList.map(branch => (
            <button
              key={branch?.guid}
              type="button"
              onClick={() => handleSelectBranch(branch)}
              className={[
                'w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer border-none bg-transparent',
                selectedBranch?.guid === branch?.guid
                  ? 'text-[#0E73F6] font-semibold bg-blue-50'
                  : 'text-slate-700 hover:bg-slate-50',
              ].join(' ')}
            >
              {branch?.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

export default Branches

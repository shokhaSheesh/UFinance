'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useUcodeRequestQuery } from '../../../hooks/useDashboard'
import { apiClient } from '../../../lib/api/ucode/base'
import { appStore } from '../../../store/app.store'
import { authStore } from '../../../store/auth.store'
import ScreenLoader from '../../shared/ScreenLoader'

const Branches = observer(() => {
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

  useQuery({
    queryKey: ['get_userPermissions'],
    queryFn: async () => getMyPermissions({
      branches_id: authStore.branch_id,
    }),
    onSuccess: (data) => {
      const permission = data?.data?.data?.role_permissions
      appStore.setNewPermission(permission)
    },
    enabled: userData?.role === 'employees',
    staleTime: 1000 * 60 * 60,
    refetchOnMount: true
  })

  const branches = useMemo(() => branchesData?.data?.data, [branchesData])
  const selectedBranch = authStore.selectBranch

  const branchesList = useMemo(() => {
    return branches?.length <= 1 ? null : branches
  }, [branches])


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
    authStore.setSelectBranch(branch)
    setReloading(true)
    if (userData?.role === 'plan_fakt_admins' && branch?.is_employee) {
      appStore.setEmployerPermission()
    } else if (userData?.role === 'employees') {
      permission = await getMyPermissions({
        branches_id: branch?.guid,
      })
      appStore.setNewPermission(permission?.data?.data?.role_permissions)
    } else if (userData?.role === 'plan_fakt_admins' && !branch?.is_employee) {
      appStore.setPlanfactPermission()
    }
    router.push('/pages/operations')
    window.location.reload()
  }



  if (!branchesList) return null

  return (
    <div className="relative" ref={containerRef}>
      {reloading && <ScreenLoader />}

      <button
        type="button"
        onClick={() => branchesList && setOpen(prev => !prev)}
        className="flex flex-col px-4 py-1 justify-start items-start text-sm text-white bg-transparent border-none cursor-pointer"
      >
        <span className="flex items-center gap-1 text-start line-clamp-1 w-full font-medium">
          {selectedBranch?.name || 'Выберите филиал'}
          {branchesList && (
            <ChevronDown
              size={14}
              className={`transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
            />
          )}
        </span>
        <span className="text-start line-clamp-1 w-full text-white/60 text-xs">&nbsp;</span>
      </button>

      {open && branchesList && (
        <div className="absolute right-0 top-[110%] mt-1 z-9999 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 overflow-hidden">
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

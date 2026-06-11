import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { apiClient } from '@/lib/api/ucode/base'

export const useBranchUsersData = ({ branchId, editingUser }) => {
  const [emailSearch, setEmailSearch] = useState('')

  const debouncedEmailSearch = useMemo(
    () => debounce((value) => setEmailSearch(value), 400),
    []
  )

  useEffect(() => {
    debouncedEmailSearch(emailSearch)
    return () => debouncedEmailSearch.cancel()
  }, [emailSearch, debouncedEmailSearch])

  const { data: branchUsers, isLoading } = useQuery({
    queryKey: ['get_branch_users', branchId],
    queryFn: () =>
      apiClient.invokeFunction({
        method: 'get_branch_users',
        data: { branches_id: branchId },
        type: 'role',
      }),
    enabled: !!branchId,
    refetchOnMount: true,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
  })

  const usersList = branchUsers?.data?.data?.items || []

  const { data: usersData, isFetching: usersLoading } = useUcodeRequestQuery({
    method: 'get_company_users',
    data: { page: 1, limit: 20, search: emailSearch },
    skip: emailSearch.length < 2 || !!editingUser,
  })

  const companyUsers = usersData?.data?.data?.response || []

  return {
    usersList,
    isLoading,
    companyUsers,
    usersLoading,
    emailSearch,
    setEmailSearch,
  }
}

'use client'

import { apiClient } from '@/lib/api/ucode/base'
import { queryClient } from '@/lib/queryClient'
import { showErrorNotification } from '@/lib/utils/notifications'
import { useMutation, useQuery } from '@tanstack/react-query'

export const useRolesData = (tc) => {
  const { data: rolesData, isLoading: rolesLoading, refetch: refetchRoles } = useQuery({
    queryKey: ['get_roles_list'],
    queryFn: () => apiClient.invokeFunction({
      method: 'get_roles',
      data: { page: 1, limit: 50 },
      type: 'role',
    }),
    refetchOnMount: true,
  })

  const roles = rolesData?.data?.data?.items || []

  const { mutateAsync: deleteRole, isPending: isDeleting } = useMutation({
    mutationKey: ['delete_role'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'delete_role', data, type: 'role' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get_roles_list'] })
    },
    onError: (error) => {
      const message = typeof error === 'string' ? error : error?.message
      if (message?.includes('assigned') || message?.includes('role is assigned')) {
        showErrorNotification(tc?.('role_error'))
      } else {
        showErrorNotification(message || tc?.('error'))
      }
    },
  })

  return {
    roles,
    rolesLoading,
    refetchRoles,
    deleteRole,
    isDeleting,
  }
}

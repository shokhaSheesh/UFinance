import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/ucode/base'
import { queryClient } from '@/lib/queryClient'

export const useRolePermissions = (guid) => {
  return useQuery({
    queryKey: ['get_role_permissions', guid],
    queryFn: () =>
      apiClient.invokeFunction({
        method: 'get_role_permissions',
        data: { role_id: guid },
        type: 'role',
      }),
    // Кроме role_permissions ответ несёт настройку закрытого периода
    // (is_data_editing_restricted и т.д.), поэтому берём весь `data`
    select: (role) => role?.data?.data,
    enabled: !!guid,
    staleTime: 1000 * 60,
    cacheTime: 1000 * 60,
  })
}

export const useUpdateRolePermissions = (guid) => {
  return useMutation({
    mutationKey: ['update_role_permissions'],
    mutationFn: (data) =>
      apiClient.invokeFunction({
        method: 'update_role_permissions',
        data,
        type: 'role',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get_role_permissions', guid] })
    },
  })
}

import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/ucode/base'

export const useUpdateProfile = () =>
  useMutation({
    mutationKey: ['update_profile'],
    mutationFn: (data) => apiClient?.invokeFunction({ method: 'auth_reset_password', data })
  })

export const useResetPassword = () =>
  useMutation({
    mutationKey: ['auth_reset_password'],
    mutationFn: (data) => apiClient?.invokeFunction({ method: 'auth_reset_password', data })
  })

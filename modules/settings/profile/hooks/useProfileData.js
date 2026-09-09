import { useMutation } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { apiClient } from '@/lib/api/ucode/base'

export const useUpdateProfile = () => {
  const locale = useLocale()

  return useMutation({
    mutationKey: ['update_profile'],
    mutationFn: (data) =>
      apiClient?.invokeFunction({ method: 'auth_reset_password', data: { lang: locale, ...data } })
  })
}

// Письмо о смене пароля бэк шлёт на языке интерфейса — поэтому передаём lang
export const useResetPassword = () => {
  const locale = useLocale()

  return useMutation({
    mutationKey: ['auth_reset_password'],
    mutationFn: (data) =>
      apiClient?.invokeFunction({ method: 'auth_reset_password', data: { lang: locale, ...data } })
  })
}

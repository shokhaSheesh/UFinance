import { apiClient } from '@/lib/api/ucode/base'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useUcodeRequestMutation } from './useDashboard'

export function useLogin() {
  const t = useTranslations('Auth')
  const router = useRouter()

  const { mutateAsync: getMyBranches } = useUcodeRequestMutation()
  const { mutateAsync: getMyPermissions } = useMutation({
    mutationKey: ['get_my_permissions'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'get_user_role_permissions', data, type: 'role' })
  })

  return useMutation({
    mutationKey: ['login'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'auth_login', data }),
    onSuccess: async (data) => {
      const responseData = data?.data?.data
      let permissions = 0

      const tokenData = responseData?.token?.access_token
      const refreshToken = responseData?.token?.refresh_token
      const userData = responseData?.user_data || responseData?.userData || responseData?.user


      // Set authentication state through MobX store
      if (tokenData && userData) {
        authStore.setAuthentication({
          token: tokenData,
          refresh_token: refreshToken,
          user_data: userData
        })
      } else {
        console.error('Missing token or user data!')
      }

      showSuccessNotification(t('notifications.loginSuccess'))

      const branchesResponse = await getMyBranches({
        method: 'get_my_branches',
        data: { page: 1, limit: 200 },
      })


      const branches = branchesResponse?.data?.data || []
      const branch = branches?.find(item => item?.is_employee == true)

      if (branches.length > 0) {
        const id = (branch?.guid || branches[0]?.guid)
        authStore.setBranches(branches)
        authStore.setBranchId(id)
        appStore.setBranchIsAccrualDate(id)
      }

      if (responseData?.role?.name !== 'plan_fakt_admins' && branches.length > 0) {
        permissions = await getMyPermissions({
          branches_id: branch?.guid || branches[0]?.guid,
          role_id: responseData?.role?.id
        })
      } else {
        appStore.setEmployerPermission()
      }


      if (responseData?.role?.name === 'employees') {
        if (permissions?.data?.message === 'error') {
          appStore.setPlanfactPermission()
        } else if (permissions?.data?.data?.role_permissions) {
          console.log('change permissions', permissions?.data?.data?.role_permissions)
          appStore.setNewPermission(permissions?.data?.data?.role_permissions)
        } else {
          appStore.setPlanfactPermission()
        }
      } else if (responseData?.role?.name === 'plan_fakt_admins') {
        appStore.setEmployerPermission()
      }

      authStore.selectBranch = branches[0]
      router.push('/pages/operations') // 7445
    },
    onError: () => {
      const errorMessage = t('notifications.loginError')
      showErrorNotification(errorMessage)
    },
  })
}

/**
 * Register mutation hook
 * Handles user registration - direct call to new u-code auth API
 * After successful registration, automatically logs in the user
 */
export function useRegister() {
  const t = useTranslations('Auth')
  const router = useRouter()

  return useMutation({
    mutationKey: ['register'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'auth_register_legal_entity', data }),
    onSuccess: (data) => {
      const responseData = data?.data?.data
      const tokenData = responseData?.token?.access_token
      const refreshToken = responseData?.token?.refresh_token
      const userData = responseData?.user_data || responseData?.userData || responseData?.user

      if (responseData?.role === "plan_fakt_admins") {
        appStore.setEmployerPermission()
      }

      if (tokenData && userData) {
        authStore.setAuthentication({
          token: tokenData,
          refresh_token: refreshToken,
          user_data: userData
        })
        showSuccessNotification(t('notifications.registerSuccess'))
        router.push('/pages/operations')
      } else {
        showErrorNotification(t('notifications.registerError'))
      }
    },
    onError: (error) => {
      console.log('Register error:', error)
      const apiError = error?.data?.error || error?.message || ''
      const errorMessage = typeof apiError === 'string' && apiError.toLowerCase().includes('exist')
        ? t('notifications.registerExistEmailError')
        : t('notifications.registerGenericError')
      showErrorNotification(errorMessage)
    },
  })
}

import { apiClient } from '@/lib/api/ucode/base'
import { queryClient } from '@/lib/queryClient'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { authStore } from '@/store/auth.store'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useUcodeRequestMutation } from './useDashboard'

const BRANCHES_REQUEST = { method: 'get_my_branches', data: { page: 1, limit: 200 } }

/**
 * Филиалы обязательны для работы приложения, а запрос иногда отваливается
 * (сеть, 500 на стороне бэка) — пробуем несколько раз, прежде чем сдаться.
 */
const loadBranches = async (getMyBranches, attempts = 3) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await getMyBranches(BRANCHES_REQUEST)
      return response?.data?.data || []
    } catch (error) {
      console.error(`get_my_branches failed (${attempt}/${attempts})`, error)
      if (attempt === attempts) return []
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt))
    }
  }
  return []
}

/**
 * Переход в приложение после успешного входа. Клиентская навигация изредка не
 * доезжает (отменённый transition, ошибка RSC-запроса, гонка с proxy.js) —
 * тогда добиваем жёстким переходом, чтобы не залипнуть на форме входа.
 */
const enterApp = (router) => {
  router.replace('/operations')
  if (typeof window === 'undefined') return
  setTimeout(() => {
    if (window.location.pathname.startsWith('/auth')) {
      window.location.replace('/operations')
    }
  }, 1200)
}

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

      const branches = await loadBranches(getMyBranches)
      const branch = branches?.find(item => item?.is_employee == true)
      if (branches.length > 0) {
        const id = (branch?.guid || branches[0]?.guid)
        authStore.setBranches(branches)
        authStore.setBranchId(id)
        appStore.setBranchIsAccrualDate(id)
        authStore.selectBranch = branch || branches[0]
      } else {
        // Филиалы не доехали — пускаем в приложение (Header перезапросит их сам),
        // но говорим об этом, иначе вход выглядит «успешно, но ничего не произошло»
        showErrorNotification(t('notifications.branchesError'))
      }

      // Права — не критично для входа: любая ошибка не должна мешать переходу
      try {
        if (responseData?.role?.name !== 'plan_fakt_admins' && branches.length > 0) {
          permissions = await getMyPermissions({
            branches_id: branch?.guid || branches[0]?.guid,
            role_id: responseData?.role?.id
          })
        } else {
          appStore.setEmployerPermission()
        }

        if (responseData?.role?.name === 'employees') {
          if (permissions?.data?.data?.role_permissions) {
            appStore.setNewPermission(permissions?.data?.data?.role_permissions)
          } else {
            appStore.setPlanfactPermission()
          }
        } else if (responseData?.role?.name === 'plan_fakt_admins') {
          appStore.setEmployerPermission()
        }
      } catch (error) {
        console.error('get_user_role_permissions failed', error)
        appStore.setPlanfactPermission()
      }

      queryClient.invalidateQueries({ queryKey: ['get_general_settings'] })

      enterApp(router) // 7445
    },
    onError: () => {
      const errorMessage = t('notifications.loginError')
      showErrorNotification(errorMessage)
    },
  })
}

export function useRegister() {
  const t = useTranslations('Auth')
  const router = useRouter()
  const { mutateAsync: getMyBranches } = useUcodeRequestMutation()

  return useMutation({
    mutationKey: ['register'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'auth_register_legal_entity', data }),
    onSuccess: async (data) => {
      const responseData = data?.data?.data
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

      const branches = await loadBranches(getMyBranches)
      const branch = branches?.find(item => item?.is_employee == true)
      if (branches.length > 0) {
        const id = (branch?.guid || branches[0]?.guid)
        authStore.setBranches(branches)
        authStore.setBranchId(id)
        appStore.setBranchIsAccrualDate(id)
        authStore.selectBranch = branch || branches[0]
      }


      if (responseData?.role === "plan_fakt_admins") {
        appStore.setEmployerPermission()
      }

      queryClient.invalidateQueries({ queryKey: ['get_general_settings'] })

      if (branches.length === 0) showErrorNotification(t('notifications.branchesError'))
      showSuccessNotification(t('notifications.registerSuccess'))
      enterApp(router)
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

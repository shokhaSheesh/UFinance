import { apiConfig } from '@/lib/config/api'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { authStore } from '@/store/auth.store'
import { useMutation } from '@tanstack/react-query'
/**
 * Login mutation hook
 * Handles user authentication - direct call to u-code API
 */
export function useLogin() {
  return useMutation({
    mutationFn: async ({ email, password }) => {
      const baseURL = apiConfig.ucode.authBaseURL
      const projectId = apiConfig.ucode.projectId
      const environmentId = apiConfig.ucode.environmentId
      const clientTypeId = apiConfig.ucode.clientTypeId
      const roleId = apiConfig.ucode.roleId

      const url = `https://api.admin.u-code.io/v2/invoke_function/planfact-plan-fact?project-id=${projectId}`


      const requestBody = {
        data: {
        method: "auth_login",
        object_data: { email, password }
    }
        // login_strategy: "EMAIL",
        // data: {
        //     email,
        //     password,
        //     client_type_id: clientTypeId,
        //     role_id: roleId
        // }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'environment-Id': environmentId,
        },
        body: JSON.stringify(requestBody),
      })

      const responseText = await response.text()

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        throw new Error('Invalid response from server')
      }

      if (!response.ok || data.status === 'ERROR' || data.status === 'BAD_REQUEST' || data.status === 'INVALID_ARGUMENT') {
        const errorMessage = typeof data.data === 'string' ? data.data : (data.description || data.message || 'Ошибка при входе')
        throw new Error(errorMessage)
      }

      return data
    },
    onSuccess: (data) => { 
      // Response structure: { status: "CREATED", data: { status: "success", data: { data: {...} } } }
      const responseData = data.data 
      
      // Токен находится глубже в структуре
      const innerData = responseData?.data?.data 
      
      const tokenData = innerData?.token?.access_token
      const refreshToken = innerData?.token?.refresh_token
      const userData = innerData?.user_data || innerData?.userData || innerData?.user


      // Set authentication state through MobX store
      if (tokenData && userData) { 
        authStore.setAuthentication({ 
          token: tokenData,
          refresh_token: refreshToken,
          user_data: userData 
        })  
        // setTimeout(() => {
        //   window.location.href = '/pages/operations'
        // }, 100)
      } else {
        console.error('Missing token or user data!')
      }

      showSuccessNotification('Успешный вход!')
      console.log('=== LOGIN SUCCESS END ===')
    },
    onError: (error) => {
      const errorMessage = error.message || 'Ошибка при входе'
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
  const loginMutation = useLogin()
  
  return useMutation({
    mutationFn: async ({ fullname, email, phone, password }) => {
      const baseURL = apiConfig.ucode.authBaseURL
      const projectId = apiConfig.ucode.projectId
      const environmentId = apiConfig.ucode.environmentId
      const clientTypeId = apiConfig.ucode.clientTypeId
      const roleId = apiConfig.ucode.roleId

      const url = `${baseURL}/v2/register?project-id=${projectId}`

      const requestBody = {
        data: {
          type: 'email',
          name: fullname,
          phone: phone,
          password: password,
          email: email,
          client_type_id: clientTypeId,
          role_id: roleId
        }
      } 

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Environment-Id': environmentId,
        },
        body: JSON.stringify(requestBody),
      })

      const responseText = await response.text()

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        throw new Error('Invalid JSON response from server')
      }

      if (!response.ok || data.status === 'ERROR' || data.status === 'BAD_REQUEST' || data.status === 'INVALID_ARGUMENT') {
        const errorMessage = typeof data.data === 'string' ? data.data : (data.message || data.description || 'Ошибка при регистрации')
        throw new Error(errorMessage)
      }

      // Return both registration data and credentials for auto-login
      return { 
        registrationData: data,
        credentials: { email, password }
      }
    },
    onSuccess: async ({ registrationData, credentials }) => {
      const responseData = registrationData.data
      
      // Check if token is provided in registration response
      if (responseData?.token?.access_token) {
        // Token provided - use it directly
        const tokenData = responseData.token.access_token
        const refreshToken = responseData.token.refresh_token
        const userData = responseData.user
        
        // Build user_data object
        const userDataForStore = {
          id: userData?.id || responseData.user_id,
          email: userData?.email || credentials.email,
          phone: userData?.phone,
          ...userData
        }
        
        authStore.setAuthentication({ 
          token: tokenData,
          refresh_token: refreshToken,
          user_data: userDataForStore
        })
      } else {
        // Token not provided - need to login
        try {
          await loginMutation.mutateAsync(credentials)
        } catch (error) {
          showErrorNotification('Регистрация успешна, но не удалось войти автоматически. Пожалуйста, войдите вручную.')
          return
        }
      }
      
      showSuccessNotification('Успешная регистрация!')
    },
    onError: (error) => {
      const errorMessage = error.message || 'Ошибка при регистрации'
      showErrorNotification(errorMessage)
    },
  })
}

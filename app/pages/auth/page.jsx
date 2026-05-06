"use client"
import { cn } from '@/app/lib/utils'
import Input from '@/components/shared/Input'
import { AuthLogo } from '@/constants/icons'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import React, { useRef, useState } from 'react'
import OperationCheckbox from '../../../components/shared/Checkbox/operationCheckbox'
import Loader from '../../../components/shared/Loader'
import LocaleSwitcher from '../../../components/shared/LocaleSwitcher/LocaleSwitcher'
import { useUcodeRequestMutation } from '../../../hooks/useDashboard'
import { apiClient } from '../../../lib/api/ucode/base'
import { showErrorNotification, showSuccessNotification } from '../../../lib/utils/notifications'
import { appStore } from '../../../store/app.store'
import { authStore } from '../../../store/auth.store'
import styles from './styles.module.scss'

export default function LoginPage() {
  const t = useTranslations('Auth')
  const [fromType, setFromType] = useState('login')
  const router = useRouter()
  const [useFound, setUseFound] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '+998',
    branchName: '',
    checked: false,
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState('')
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordError, setForgotPasswordError] = useState('')
  const phoneInputRef = useRef(null)
  const branchDropdownRef = useRef(null)


  const { mutateAsync: getMyBranches, isPending: branchesLoading } = useUcodeRequestMutation()
  const { mutateAsync: getMyPermissions, isPending: permissionsLoading } = useMutation({
    mutationKey: ['get_my_permissions'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'get_user_role_permissions', data, type: 'role' })
  })
  const { mutateAsync: forgotPasswordMutation, isPending: isForgotPasswordLoading } = useMutation({
    mutationKey: ['auth_forgot_password'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'auth_forgot_password', data })
  })


  // Close branch dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target)) {
        setBranchDropdownOpen(false)
      }
    }

    if (branchDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [branchDropdownOpen])

  // Login & Register mutations
  const loginMutation = useMutation({
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
      const useFound = responseData?.user_found
      setUseFound(useFound)

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

  const { mutateAsync: registerAsync, isPending: isRegistering } = useMutation({
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
      const errorMessage = error.message || t('notifications.registerGenericError')
      showErrorNotification(errorMessage)
    },
  })

  // Format phone number with mask
  const formatPhoneNumber = (value) => {
    // Remove all non-digits except the leading +
    const digits = value.replace(/[^\d]/g, '')

    // Always start with +998
    if (!value.startsWith('+998')) {
      return '+998'
    }

    // Limit to 12 digits total (+998 + 9 digits)
    const limitedDigits = digits.slice(0, 12)

    // Apply mask: +998 XX XXX XX XX
    if (limitedDigits.length <= 3) {
      return '+998'
    } else if (limitedDigits.length <= 5) {
      return `+998 ${limitedDigits.slice(3)}`
    } else if (limitedDigits.length <= 8) {
      return `+998 ${limitedDigits.slice(3, 5)} ${limitedDigits.slice(5)}`
    } else if (limitedDigits.length <= 10) {
      return `+998 ${limitedDigits.slice(3, 5)} ${limitedDigits.slice(5, 8)} ${limitedDigits.slice(8)}`
    } else {
      return `+998 ${limitedDigits.slice(3, 5)} ${limitedDigits.slice(5, 8)} ${limitedDigits.slice(8, 10)} ${limitedDigits.slice(10)}`
    }
  }

  // Get clean phone number for API (only digits)
  const getCleanPhoneNumber = (formattedPhone) => {
    return formattedPhone.replace(/[^\d]/g, '')
  }

  const handlePhoneChange = (e) => {
    const input = e.target
    const value = input.value
    const cursorPosition = input.selectionStart

    // Prevent deleting +998
    if (!value.startsWith('+998')) {
      return
    }

    // Get old value to compare
    const oldValue = formData.phone
    const oldDigits = oldValue.replace(/[^\d]/g, '')
    const newDigits = value.replace(/[^\d]/g, '')

    // Format the new value
    const formatted = formatPhoneNumber(value)

    // Calculate new cursor position
    let newCursorPosition = cursorPosition

    // If we're adding digits
    if (newDigits.length > oldDigits.length) {
      // Count spaces before cursor in formatted string
      const spacesBeforeCursor = formatted.slice(0, cursorPosition).split(' ').length - 1
      const oldSpacesBeforeCursor = oldValue.slice(0, cursorPosition).split(' ').length - 1

      // Adjust cursor if a space was added
      if (spacesBeforeCursor > oldSpacesBeforeCursor) {
        newCursorPosition = cursorPosition + 1
      }
    }
    // If we're deleting digits
    else if (newDigits.length < oldDigits.length) {
      // Keep cursor at same position
      newCursorPosition = cursorPosition
    }

    setFormData({ ...formData, phone: formatted })
    setFieldErrors({ ...fieldErrors, phone: '' })

    // Restore cursor position after React updates
    setTimeout(() => {
      if (phoneInputRef.current) {
        phoneInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  const handlePasswordChange = (e, field = 'password') => {
    const value = e.target.value

    if (field === 'password') {
      setFormData({ ...formData, password: value })
      setFieldErrors({ ...fieldErrors, password: '' })
    } else {
      setConfirmPassword(value)
      setFieldErrors({ ...fieldErrors, confirmPassword: '' })
    }
  }

  const validateForm = () => {
    const errors = {}
    if (fromType === 'register') {
      if (!formData.branchName.trim()) {
        errors.branchName = t('errors.branchNameRequired')
      }
      if (!formData.name.trim()) {
        errors.name = t('errors.nameRequired')
      }
      if (!formData.email.trim()) {
        errors.email = t('errors.emailRequired')
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = t('errors.emailInvalid')
      }
      const cleanPhone = getCleanPhoneNumber(formData.phone)
      if (cleanPhone.length !== 12) {
        errors.phone = t('errors.phoneIncomplete')
      }
      if (!formData.checked) {
        errors.terms = t('errors.termsRequired')
      }
    } else if (fromType === 'login') {
      if (!formData.email.trim()) {
        errors.email = t('errors.emailRequired')
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = t('errors.emailInvalid')
      }
      if (!formData.password) {
        errors.password = t('errors.passwordRequired')
      }
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      if (fromType === 'login') {
        await loginMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
        })
      } else if (fromType === 'forgot') {
        if (!forgotPasswordEmail) {
          setForgotPasswordError(t('errors.emailRequired'))
          return
        }
        if (!/\S+@\S+\.\S+/.test(forgotPasswordEmail)) {
          setForgotPasswordError(t('errors.emailInvalid'))
          return
        }
        try {
          await forgotPasswordMutation({ email: forgotPasswordEmail })
          showSuccessNotification(t('notifications.forgotSuccess'))
          setForgotPasswordEmail('')
          setForgotPasswordError('')
          setFromType('login')
        } catch (error) {
          showErrorNotification(error?.message || t('notifications.forgotError'))
        }
      } else {
        const cleanPhone = getCleanPhoneNumber(formData.phone)
        await registerAsync({
          name: formData.name,
          email: formData.email,
          phone: cleanPhone,
          legal_entity_name: formData.name,
          branch_name: formData.branchName,
        })
      }
    } catch (error) {
      // errors are handled by onError callbacks in each mutation
    }
  }

  const toggleFormType = () => {
    setFromType(prev => prev === 'login' ? 'register' : 'login')
    setError('')
    setFieldErrors({})
    setFormData({ email: '', password: '', name: '', phone: '+998', branchName: '', checked: false })
    setConfirmPassword('')
    setSelectedBranch('')
    setBranchDropdownOpen(false)
    setForgotPasswordEmail('')
    setForgotPasswordError('')
  }

  return (
    <div className="fixed flex flex-col w-full h-full bg-linear-to-br from-[#456fad] to-[#022565]  items-center justify-center ">
      <div className="absolute top-10 left-10">
        <AuthLogo color="#ffffff" width="114" height="27" />
      </div>
      <div className="absolute top-10 right-10">
        <LocaleSwitcher />
      </div>
      {/* Login Card */}
      <div className=" w-[450px] rounded-md p-6">
        <div className={styles.card}>

          {/* Logo/Title */}
          <div className={styles.cardLogo}>
            <AuthLogo color="#000000" width="150" height="36" />
          </div>

          <h1 className={styles.cardTitle}>
            {fromType === 'login' ? t('title.login') : fromType === 'forgot' ? t('title.forgot') : t('title.register')}
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {fromType === 'register' && (
              <>
                {/* Branch Name */}
                <div className={styles.inputGroup}>
                  <div className={styles.inputWrapper}>
                    <Input
                      type="text"
                      value={formData.branchName}
                      onChange={(e) => {
                        setFormData({ ...formData, branchName: e.target.value })
                        setFieldErrors({ ...fieldErrors, branchName: '' })
                      }}
                      onFocus={() => setFocusedField('branchName')}
                      onBlur={() => setFocusedField(null)}
                      className={cn('h-10! p-4!',
                        focusedField === 'branchName' && 'focus:border-primary',
                      )}
                      hasError={fieldErrors.branchName}
                      placeholder={t('fields.branchName')}
                    />
                  </div>
                  {fieldErrors.branchName && (
                    <div className={styles.fieldError}>{fieldErrors.branchName}</div>
                  )}
                </div>

                {/* Name */}
                <div className={styles.inputGroup}>
                  <div className={styles.inputWrapper}>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value })
                        setFieldErrors({ ...fieldErrors, name: '' })
                      }}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      className={cn('h-10! p-4!',
                        focusedField === 'name' && 'focus:border-primary',
                      )}
                      hasError={fieldErrors.name}
                      placeholder={t('fields.name')}
                    />
                  </div>
                  {fieldErrors.name && (
                    <div className={styles.fieldError}>{fieldErrors.name}</div>
                  )}
                </div>

                {/* Email */}
                <div className={styles.inputGroup}>
                  <div className={styles.inputWrapper}>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value })
                        setFieldErrors({ ...fieldErrors, email: '' })
                      }}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className={cn('h-10! p-4!',
                        focusedField === 'email' && 'focus:border-primary',
                      )}
                      hasError={fieldErrors.email}
                      placeholder={t('fields.email')}
                    />
                  </div>
                  {fieldErrors.email && (
                    <div className={styles.fieldError}>{fieldErrors.email}</div>
                  )}
                </div>

                {/* Phone */}
                <div className={styles.inputGroup}>
                  <div className={styles.inputWrapper}>
                    <Input
                      ref={phoneInputRef}
                      type="tel"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      className={cn('h-10! p-4!',
                        focusedField === 'phone' && 'focus:border-primary',
                      )}
                      hasError={fieldErrors.phone}
                      placeholder={t('fields.phone')}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <div className={styles.fieldError}>{fieldErrors.phone}</div>
                  )}
                </div>
              </>
            )}

            {/* Email (Only on login) */}
            {fromType === 'login' && (
              <div className={styles.inputGroup}>
                <div className={styles.inputWrapper}>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      setFieldErrors({ ...fieldErrors, email: '' })
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={cn('h-10! p-4!',
                      focusedField === 'email' && 'focus:border-primary',
                    )}
                    hasError={fieldErrors.email}
                    placeholder="Email"
                  />
                </div>
                {/* {fieldErrors.email && (
                  <div className={styles.fieldError}>{fieldErrors.email}</div>
                )} */}
              </div>
            )}

            {/* Password */}
            {fromType === 'login' && <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e, 'password')}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={cn('h-10! p-4!',
                    focusedField === 'password' && 'focus:border-primary',
                  )}
                  hasError={fieldErrors.password}
                  placeholder={fromType === 'register' ? t('fields.passwordCreate') : t('fields.password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.eyeButton}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && (
                <div className={styles.fieldError}>{fieldErrors.password}</div>
              )}
            </div>}

            {/* Forgot Password Link */}
            {fromType === 'login' && (
              <div className="text-right mb-2">
                <span
                  onClick={() => {
                    setFromType('forgot')
                    setError('')
                    setFieldErrors({})
                    setForgotPasswordEmail(formData.email)
                    setForgotPasswordError('')
                  }}
                  className="text-sm text-[#0E73F6] hover:text-[#0b5fd4] cursor-pointer"
                >
                  {t('forgotPasswordLink')}
                </span>
              </div>
            )}

            {/* Forgot Password Form */}
            {fromType === 'forgot' && (
              <>
                <div className={styles.inputGroup}>
                  <div className={styles.inputWrapper}>
                    <Input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => {
                        setForgotPasswordEmail(e.target.value)
                        setForgotPasswordError('')
                      }}
                      onFocus={() => setFocusedField('forgotEmail')}
                      onBlur={() => setFocusedField(null)}
                      className={cn('h-10! p-4!',
                        focusedField === 'forgotEmail' && 'focus:border-primary',
                      )}
                      hasError={forgotPasswordError}
                      placeholder="Email"
                    />
                  </div>
                  {forgotPasswordError && (
                    <div className={styles.fieldError}>{forgotPasswordError}</div>
                  )}
                </div>
              </>
            )}

            {/* Checkbox (Only on register) */}
            {fromType === 'register' && (
              <div className={styles.checkboxGroup}>
                <OperationCheckbox
                  id="terms"
                  checked={formData.checked}
                  onChange={() => {
                    setFormData({ ...formData, checked: !formData.checked })
                    setFieldErrors({ ...fieldErrors, terms: '' })
                  }}
                />
                <label htmlFor="terms" className={styles.checkboxLabel}>
                  {t('termsCheckboxPrefix')}<span className={styles.highlight}>{t('termsCheckboxAccent')}</span>{t('termsCheckboxSuffix')}
                </label>
              </div>
            )}
            {fieldErrors.terms && (
              <div className={styles.fieldError}>{fieldErrors.terms}</div>
            )}

            {/* Error Message */}
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            {/* Action Links */}
            <div className={styles.actionLinks}>
              {fromType === 'forgot' ? (
                <span>
                  {t('actions.backToLoginPrefix')}
                  <span
                    onClick={() => {
                      setFromType('login')
                      setError('')
                      setFieldErrors({})
                      setForgotPasswordError('')
                    }}
                    className={styles.actionToggle}
                  >
                    {t('actions.backToLoginLink')}
                  </span>
                </span>
              ) : (
                  <span>
                    {fromType === 'login' ? t('actions.noAccount') : t('actions.hasAccount')}
                    <span
                      onClick={toggleFormType}
                      className={styles.actionToggle}
                    >
                      {fromType === 'login' ? t('actions.toRegister') : t('actions.toLogin')}
                    </span>
                  </span>
              )}
            </div>

            {/* Submit Button */}
            <div className={styles.submitWrapper}>
              <button
                type="submit"
                disabled={
                  fromType === 'login' ? loginMutation.isPending
                    : fromType === 'forgot' ? isForgotPasswordLoading
                      : isRegistering
                }
                className={cn(
                  styles.submitButton,
                  fromType === 'login' && styles.loginButton
                )}
              >
                {fromType === 'login'
                  ? (loginMutation.isPending ? (<Loader />) : t('submit.login'))
                  : fromType === 'forgot'
                    ? (isForgotPasswordLoading ? (<Loader />) : t('submit.forgot'))
                    : (isRegistering ? (<Loader />) : t('submit.register'))}
              </button>
            </div>

            {fromType !== 'forgot' && (
              <div className={styles.termsText}>
                {t('termsNoticePrefix')}{fromType === 'login' ? t('submit.login') : t('submit.register')}{t('termsNoticeSuffix')}
                <a href="#">{t('termsNoticeLink')}</a>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

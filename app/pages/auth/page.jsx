"use client"
import { cn } from '@/app/lib/utils'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import Input from '@/components/shared/Input'
import Loader from '@/components/shared/Loader'
import LocaleSwitcher from '@/components/shared/LocaleSwitcher/LocaleSwitcher'
import { AuthLogo } from '@/constants/icons'
import { useLogin, useRegister } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api/ucode/base'
import { formatPhoneNumber, getCleanPhoneNumber } from '@/utils/helpers'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import styles from './styles.module.scss'

export default function LoginPage() {
  const t = useTranslations('Auth')
  const [formType, setFormType] = useState('login')
  const [showPassword, setShowPassword] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    watch
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      name: '',
      phone: '+998',
      branchName: '',
      terms: false,
      forgotEmail: ''
    }
  })

  const watchedEmail = watch('email')

  const loginMutation = useLogin()
  const { mutateAsync: registerAsync, isPending: isRegistering } = useRegister()
  const { mutateAsync: forgotPasswordMutation, isPending: isForgotPasswordLoading } = useMutation({
    mutationKey: ['auth_forgot_password'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'auth_forgot_password', data })
  })

  const toggleFormType = () => {
    const newType = formType === 'login' ? 'register' : 'login'
    setFormType(newType)
    reset({
      email: '',
      password: '',
      name: '',
      phone: '+998',
      branchName: '',
      terms: false,
      forgotEmail: ''
    })
  }

  const handleFormTypeChange = (newType) => {
    setFormType(newType)
    reset({
      email: newType === 'forgot' ? watchedEmail : '',
      password: '',
      name: '',
      phone: '+998',
      branchName: '',
      terms: false,
      forgotEmail: newType === 'forgot' ? watchedEmail : ''
    })
  }

  const onSubmit = async (data) => {
    if (formType === 'login') {
      await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      })
    } else if (formType === 'forgot') {
      try {
        await forgotPasswordMutation({ email: data.forgotEmail })
        showSuccessNotification(t('notifications.forgotSuccess'))
        setFormType('login')
      } catch (error) {
        showErrorNotification(error?.message || t('notifications.forgotError'))
      }
    } else {
      const cleanPhone = getCleanPhoneNumber(data.phone)
      await registerAsync({
        name: data.name,
        email: data.email,
        phone: cleanPhone,
        legal_entity_name: data.name,
        branch_name: data.branchName,
      }).catch()
    }
  }

  const isLoading = loginMutation.isPending || isRegistering || isForgotPasswordLoading

  const inputRules = {
    email: {
      required: t('errors.emailRequired'),
      pattern: { value: /\S+@\S+\.\S+/, message: t('errors.emailInvalid') }
    },
    password: { required: t('errors.passwordRequired') },
    branchName: { required: t('errors.branchNameRequired') },
    name: { required: t('errors.nameRequired') },
    phone: {
      required: t('errors.phoneIncomplete'),
      validate: (v) => getCleanPhoneNumber(v).length === 12 || t('errors.phoneIncomplete')
    },
    terms: {
      validate: (v) => v === true || t('errors.termsRequired')
    },
    forgotEmail: {
      required: t('errors.emailRequired'),
      pattern: { value: /\S+@\S+\.\S+/, message: t('errors.emailInvalid') }
    }
  }

  return (
    <div className="fixed flex flex-col w-full h-full bg-linear-to-br from-[#456fad] to-[#022565] items-center justify-center">
      <div className="absolute top-10 left-10">
        <AuthLogo color="#ffffff" width="114" height="27" />
      </div>
      <div className="absolute top-10 right-10">
        <LocaleSwitcher />
      </div>

      <div className="w-[500px] rounded-md p-6">
        <div className={styles.card}>
          <div className={styles.cardLogo}>
            <AuthLogo color="#000000" width="150" height="36" />
          </div>

          <h1 className={styles.cardTitle}>
            {formType === 'login' ? t('title.login') : formType === 'forgot' ? t('title.forgot') : t('title.register')}
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {/* Register Fields */}
            {formType === 'register' && (
              <>
                <Controller
                  name="branchName"
                  control={control}
                  rules={inputRules.branchName}
                  render={({ field, fieldState }) => (
                    <div className={styles.inputGroup}>
                      <div className={styles.inputWrapper}>
                        <Input
                          {...field}
                          type="text"
                          hasError={fieldState.error?.message}
                          placeholder={t('fields.branchName')}
                          className="h-10! p-4!"
                        />
                      </div>
                      {fieldState.error && (
                        <div className={styles.fieldError}>{fieldState.error.message}</div>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="name"
                  control={control}
                  rules={inputRules.name}
                  render={({ field, fieldState }) => (
                    <div className={styles.inputGroup}>
                      <div className={styles.inputWrapper}>
                        <Input
                          {...field}
                          type="text"
                          hasError={fieldState.error?.message}
                          placeholder={t('fields.name')}
                          className="h-10! p-4!"
                        />
                      </div>
                      {fieldState.error && (
                        <div className={styles.fieldError}>{fieldState.error.message}</div>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="email"
                  control={control}
                  rules={inputRules.email}
                  render={({ field, fieldState }) => (
                    <div className={styles.inputGroup}>
                      <div className={styles.inputWrapper}>
                        <Input
                          {...field}
                          type="email"
                          hasError={fieldState.error?.message}
                          placeholder={t('fields.email')}
                          className="h-10! p-4!"
                        />
                      </div>
                      {fieldState.error && (
                        <div className={styles.fieldError}>{fieldState.error.message}</div>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="phone"
                  control={control}
                  rules={inputRules.phone}
                  render={({ field, fieldState }) => (
                    <div className={styles.inputGroup}>
                      <div className={styles.inputWrapper}>
                        <Input
                          {...field}
                          type="tel"
                          hasError={fieldState.error?.message}
                          placeholder={t('fields.phone')}
                          className="h-10! p-4!"
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value)
                            field.onChange(formatted)
                          }}
                        />
                      </div>
                      {fieldState.error && (
                        <div className={styles.fieldError}>{fieldState.error.message}</div>
                      )}
                    </div>
                  )}
                />
              </>
            )}

            {/* Login Email */}
            {formType === 'login' && (
              <Controller
                name="email"
                control={control}
                rules={inputRules.email}
                render={({ field, fieldState }) => (
                  <div className={styles.inputGroup}>
                    <div className={styles.inputWrapper}>
                      <Input
                        {...field}
                        type="email"
                        hasError={fieldState.error?.message}
                        placeholder="Email"
                        className="h-10! p-4!"
                      />
                    </div>
                  </div>
                )}
              />
            )}

            {/* Login Password */}
            {formType === 'login' && (
              <Controller
                name="password"
                control={control}
                rules={inputRules.password}
                render={({ field, fieldState }) => (
                  <div className={styles.inputGroup}>
                    <div className={styles.inputWrapper}>
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        hasError={fieldState.error?.message}
                        placeholder={t('fields.password')}
                        className="h-10! p-4!"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={styles.eyeButton}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {fieldState.error && (
                      <div className={styles.fieldError}>{fieldState.error.message}</div>
                    )}
                  </div>
                )}
              />
            )}

            {/* Forgot Password Link */}
            {formType === 'login' && (
              <div className="text-right mb-2">
                <span
                  onClick={() => handleFormTypeChange('forgot')}
                  className="text-sm text-[#0E73F6] hover:text-[#0b5fd4] cursor-pointer"
                >
                  {t('forgotPasswordLink')}
                </span>
              </div>
            )}

            {/* Forgot Password Form */}
            {formType === 'forgot' && (
              <Controller
                name="forgotEmail"
                control={control}
                rules={inputRules.forgotEmail}
                render={({ field, fieldState }) => (
                  <div className={styles.inputGroup}>
                    <div className={styles.inputWrapper}>
                      <Input
                        {...field}
                        type="email"
                        hasError={fieldState.error?.message}
                        placeholder="Email"
                        className="h-10! p-4!"
                      />
                    </div>
                    {fieldState.error && (
                      <div className={styles.fieldError}>{fieldState.error.message}</div>
                    )}
                  </div>
                )}
              />
            )}

            {/* Terms Checkbox */}
            {formType === 'register' && (
              <Controller
                name="terms"
                control={control}
                rules={inputRules.terms}
                render={({ field, fieldState }) => (
                  <>
                    <div className={styles.checkboxGroup}>
                      <OperationCheckbox
                        id="terms"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                      <label htmlFor="terms" className={styles.checkboxLabel}>
                        {t('termsCheckboxPrefix')}<span className={styles.highlight}>{t('termsCheckboxAccent')}</span>{t('termsCheckboxSuffix')}
                      </label>
                    </div>
                    {fieldState.error && (
                      <div className={styles.fieldError}>{fieldState.error.message}</div>
                    )}
                  </>
                )}
              />
            )}

            {/* Action Links */}
            <div className={styles.actionLinks}>
              {formType === 'forgot' ? (
                <span>
                  {t('actions.backToLoginPrefix')}
                  <span
                    onClick={() => handleFormTypeChange('login')}
                    className={styles.actionToggle}
                  >
                    {t('actions.backToLoginLink')}
                  </span>
                </span>
              ) : (
                  <span>
                    {formType === 'login' ? t('actions.noAccount') : t('actions.hasAccount')}
                    <span onClick={toggleFormType} className={styles.actionToggle}>
                      {formType === 'login' ? t('actions.toRegister') : t('actions.toLogin')}
                    </span>
                  </span>
              )}
            </div>

            {/* Submit Button */}
            <div className={styles.submitWrapper}>
              <button
                type="submit"
                disabled={isLoading}
                className={cn(styles.submitButton, formType === 'login' && styles.loginButton)}
              >
                {isLoading ? <Loader /> : t(`submit.${formType === 'forgot' ? 'forgot' : formType}`)}
              </button>
            </div>

            {formType !== 'forgot' && (
              <div className={styles.termsText}>
                {t('termsNoticePrefix')}{t(`submit.${formType}`)}{t('termsNoticeSuffix')}
                <a href="#">{t('termsNoticeLink')}</a>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

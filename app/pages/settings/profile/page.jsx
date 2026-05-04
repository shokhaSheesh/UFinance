"use client"
import { cn } from '@/app/lib/utils'
import Input from '@/components/shared/Input'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { apiClient } from '../../../../lib/api/ucode/base'
import { authStore } from '../../../../store/auth.store'

const formatPhoneNumber = (value) => {
  const digits = value.replace(/[^\d]/g, '')

  if (!value.startsWith('+998')) {
    return '+998'
  }

  const limitedDigits = digits.slice(0, 12)

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

const getCleanPhoneNumber = (formattedPhone) => formattedPhone.replace(/[^\d]/g, '')

const formatInitialPhone = (rawPhone) => {
  if (!rawPhone) return '+998'
  const digits = String(rawPhone).replace(/[^\d]/g, '')
  if (!digits) return '+998'
  const withPrefix = digits.startsWith('998') ? `+${digits}` : `+998${digits}`
  return formatPhoneNumber(withPrefix)
}

const MyProfile = observer(() => {
  const tp = useTranslations('Settings.profile')
  const tc = useTranslations('Settings.common')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+998')
  const [profileErrors, setProfileErrors] = useState({})
  const phoneInputRef = useRef(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({})

  useEffect(() => {
    setName(authStore?.userData?.name || '')
    setPhone(formatInitialPhone(authStore?.userData?.phone))
  }, [])

  const { mutateAsync: updateProfileMutation, isPending: isUpdatingProfile } = useMutation({
    mutationKey: ['update_my_profile'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'update_my_profile', data })
  })

  const { mutateAsync: resetPasswordMutation, isPending: isResetting } = useMutation({
    mutationKey: ['auth_reset_password'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'auth_reset_password', data })
  })

  const handlePhoneChange = (e) => {
    const input = e.target
    const value = input.value
    const cursorPosition = input.selectionStart

    if (!value.startsWith('+998')) return

    const oldDigits = phone.replace(/[^\d]/g, '')
    const newDigits = value.replace(/[^\d]/g, '')
    const formatted = formatPhoneNumber(value)

    let newCursorPosition = cursorPosition
    if (newDigits.length > oldDigits.length) {
      const spacesBeforeCursor = formatted.slice(0, cursorPosition).split(' ').length - 1
      const oldSpacesBeforeCursor = phone.slice(0, cursorPosition).split(' ').length - 1
      if (spacesBeforeCursor > oldSpacesBeforeCursor) {
        newCursorPosition = cursorPosition + 1
      }
    }

    setPhone(formatted)
    setProfileErrors({ ...profileErrors, phone: '' })

    setTimeout(() => {
      if (phoneInputRef.current) {
        phoneInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  const validateProfile = () => {
    const errors = {}
    if (!name.trim()) {
      errors.name = tp('errors.nameRequired')
    }
    const cleanPhone = getCleanPhoneNumber(phone)
    if (cleanPhone.length !== 12) {
      errors.phone = tp('errors.phoneRequired')
    }
    setProfileErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleProfileSubmit = async () => {
    if (!validateProfile()) return

    const cleanPhone = getCleanPhoneNumber(phone)
    try {
      await updateProfileMutation({
        name: name.trim(),
        phone: cleanPhone
      })
      authStore.userData = {
        ...authStore.userData,
        name: name.trim(),
        phone: cleanPhone
      }
      showSuccessNotification(tp('success'))
    } catch (error) {
      showErrorNotification(error?.message || tp('error'))
    }
  }

  const validatePassword = () => {
    const errors = {}
    if (!currentPassword) {
      errors.currentPassword = tp('password.errors.currentRequired')
    }
    if (!newPassword) {
      errors.newPassword = tp('password.errors.newRequired')
    } else if (newPassword.length < 6) {
      errors.newPassword = tp('password.errors.minLength')
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.newPassword = tp('password.errors.uppercase')
    } else if (!/[a-z]/.test(newPassword)) {
      errors.newPassword = tp('password.errors.lowercase')
    } else if (!/[0-9]/.test(newPassword)) {
      errors.newPassword = tp('password.errors.number')
    }
    if (!confirmPassword) {
      errors.confirmPassword = tp('password.errors.confirmRequired')
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = tp('password.errors.match')
    }
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePasswordSubmit = async () => {
    if (!validatePassword()) return

    try {
      await resetPasswordMutation({
        old_password: currentPassword,
        password: newPassword
      })
      showSuccessNotification(tp('password.success'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordErrors({})
    } catch (error) {
      showErrorNotification(error?.message || tp('password.error'))
    }
  }

  return (
    <div className="flex w-full flex-col gap-6  overflow-auto bg-white">
      <div className="flex-1">
        <h1 className="text-2xl sticky p-6 top-0 z-10 bg-white font-bold text-neutral-800">{tp('pageTitle')}</h1>

        <div className="bg-white p-6 rounded-lg w-72  border-gray-200 py-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-700">{tp('fullName')}</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setProfileErrors({ ...profileErrors, name: '' })
                }}
                placeholder={tp('fullNamePlaceholder')}
                hasError={profileErrors.name}
                className="h-10!"
              />
              {profileErrors.name && (
                <span className="text-xs text-red-500">{profileErrors.name}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-700">{tp('phone')}</label>
              <Input
                ref={phoneInputRef}
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder={tp('phonePlaceholder')}
                hasError={profileErrors.phone}
                className="h-10!"
              />
              {profileErrors.phone && (
                <span className="text-xs text-red-500">{profileErrors.phone}</span>
              )}
            </div>

            <button
              onClick={handleProfileSubmit}
              disabled={isUpdatingProfile}
              className={cn(
                "primary-btn w-44",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isUpdatingProfile ? tp('saving') : tp('save')}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg w-72 border-gray-200 py-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">{tp('password.title')}</h2>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-700">{tp('password.current')}</label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    setPasswordErrors({ ...passwordErrors, currentPassword: '' })
                  }}
                  placeholder={tp('password.currentPlaceholder')}
                  hasError={passwordErrors.currentPassword}
                  className="h-10! pr-10!"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <span className="text-xs text-red-500">{passwordErrors.currentPassword}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-700">{tp('password.new')}</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setPasswordErrors({ ...passwordErrors, newPassword: '' })
                  }}
                  placeholder={tp('password.newPlaceholder')}
                  hasError={passwordErrors.newPassword}
                  className="h-10! pr-10!"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <span className="text-xs text-red-500">{passwordErrors.newPassword}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-700">{tp('password.confirm')}</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setPasswordErrors({ ...passwordErrors, confirmPassword: '' })
                  }}
                  placeholder={tp('password.confirmPlaceholder')}
                  hasError={passwordErrors.confirmPassword}
                  className="h-10! pr-10!"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <span className="text-xs text-red-500">{passwordErrors.confirmPassword}</span>
              )}
            </div>

            <button
              onClick={handlePasswordSubmit}
              disabled={isResetting}
              className={cn(
                "primary-btn w-44",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isResetting ? tp('saving') : tp('password.change')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

export default MyProfile

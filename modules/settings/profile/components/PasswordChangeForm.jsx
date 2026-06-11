'use client'
import { cn } from '@/lib/utils'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useResetPassword } from '@/modules/settings/profile/hooks/useProfileData'
import PasswordInput from './PasswordInput'

const PasswordChangeForm = () => {
  const tp = useTranslations('Settings.profile')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState({})

  const { mutateAsync: resetPasswordMutation, isPending: isResetting } = useResetPassword()

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
    <div className="bg-white p-6 rounded-lg w-72 border-gray-200 py-6">
      <h2 className="text-lg font-semibold text-neutral-800 mb-4">{tp('password.title')}</h2>
      <div className="flex flex-col gap-5">
        <PasswordInput
          label={tp('password.current')}
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e?.target?.value || '')
            setPasswordErrors({ ...passwordErrors, currentPassword: '' })
          }}
          placeholder={tp('password.currentPlaceholder')}
          error={passwordErrors?.currentPassword}
        />

        <PasswordInput
          label={tp('password.new')}
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e?.target?.value || '')
            setPasswordErrors({ ...passwordErrors, newPassword: '' })
          }}
          placeholder={tp('password.newPlaceholder')}
          error={passwordErrors?.newPassword}
        />

        <PasswordInput
          label={tp('password.confirm')}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e?.target?.value || '')
            setPasswordErrors({ ...passwordErrors, confirmPassword: '' })
          }}
          placeholder={tp('password.confirmPlaceholder')}
          error={passwordErrors?.confirmPassword}
        />

        <button
          onClick={handlePasswordSubmit}
          disabled={isResetting}
          className={cn(
            'primary-btn w-44',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isResetting ? tp('saving') : tp('password.change')}
        </button>
      </div>
    </div>
  )
}

export default PasswordChangeForm

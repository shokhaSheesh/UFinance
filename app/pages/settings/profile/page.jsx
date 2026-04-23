"use client"
import { cn } from '@/app/lib/utils'
import Input from '@/components/shared/Input'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { apiClient } from '../../../../lib/api/ucode/base'

const MyProfile = () => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const { mutateAsync: resetPasswordMutation, isPending: isResetting } = useMutation({
    mutationKey: ['auth_reset_password'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'auth_reset_password', data })
  })

  const validate = () => {
    const newErrors = {}
    if (!currentPassword) {
      newErrors.currentPassword = 'Введите текущий пароль'
    }
    if (!newPassword) {
      newErrors.newPassword = 'Введите новый пароль'
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Пароль должен содержать минимум 6 символов'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    try {
      await resetPasswordMutation({
        old_password: currentPassword,
        password: newPassword
      })
      showSuccessNotification('Пароль успешно изменен')
      setCurrentPassword('')// RenZ4BZ9
      setNewPassword('')
      setErrors({})
    } catch (error) {
      showErrorNotification(error?.message || 'Ошибка при смене пароля')
    }
  }

  return (
    <div className="w-full gap-6 p-6 max-w-2xl bg-white">
      <h1 className="text-2xl font-bold text-neutral-800">Мой профиль</h1>

      <div className="bg-white rounded-lg w-72 border-gray-200 py-6">
        <div className="flex flex-col gap-5">
          {/* Current Password */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-700">Текущий пароль</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value)
                  setErrors({ ...errors, currentPassword: '' })
                }}
                placeholder="Введите текущий пароль"
                hasError={errors.currentPassword}
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
            {errors.currentPassword && (
              <span className="text-xs text-red-500">{errors.currentPassword}</span>
            )}
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-700">Новый пароль</label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setErrors({ ...errors, newPassword: '' })
                }}
                placeholder="Введите новый пароль"
                hasError={errors.newPassword}
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
            {errors.newPassword && (
              <span className="text-xs text-red-500">{errors.newPassword}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isResetting}
            className={cn(
              "primary-btn w-44",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isResetting ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MyProfile
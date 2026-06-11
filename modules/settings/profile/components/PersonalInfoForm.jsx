'use client'
import Input from '@/components/shared/Input'
import { cn } from '@/lib/utils'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { authStore } from '@/store/auth.store'
import { useUpdateProfile } from '@/modules/settings/profile/hooks/useProfileData'
import {
  formatInitialPhone,
  formatPhoneNumber,
  getCleanPhoneNumber
} from '@/modules/settings/profile/utils/phoneFormat'

const PersonalInfoForm = observer(() => {
  const tp = useTranslations('Settings.profile')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+998')
  const [profileErrors, setProfileErrors] = useState({})
  const phoneInputRef = useRef(null)

  const { mutateAsync: updateProfileMutation, isPending: isUpdatingProfile } = useUpdateProfile()

  useEffect(() => {
    setName(authStore?.userData?.name || '')
    setPhone(formatInitialPhone(authStore?.userData?.phone))
  }, [])

  const handlePhoneChange = (e) => {
    const input = e?.target
    const value = input?.value || ''
    const cursorPosition = input?.selectionStart

    if (!value?.startsWith('+998')) return

    const oldDigits = phone?.replace(/[^\d]/g, '') || ''
    const newDigits = value?.replace(/[^\d]/g, '') || ''
    const formatted = formatPhoneNumber(value)

    let newCursorPosition = cursorPosition
    if (newDigits.length > oldDigits.length) {
      const spacesBeforeCursor = formatted?.slice(0, cursorPosition)?.split(' ')?.length - 1
      const oldSpacesBeforeCursor = phone?.slice(0, cursorPosition)?.split(' ')?.length - 1
      if (spacesBeforeCursor > oldSpacesBeforeCursor) {
        newCursorPosition = cursorPosition + 1
      }
    }

    setPhone(formatted)
    setProfileErrors({ ...profileErrors, phone: '' })

    setTimeout(() => {
      if (phoneInputRef?.current) {
        phoneInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  const validateProfile = () => {
    const errors = {}
    if (!name?.trim()) {
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
        name: name?.trim(),
        phone: cleanPhone
      })
      authStore.userData = {
        ...authStore?.userData,
        name: name?.trim(),
        phone: cleanPhone
      }
      showSuccessNotification(tp('success'))
    } catch (error) {
      showErrorNotification(error?.message || tp('error'))
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg w-72  border-gray-200 py-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-neutral-700">{tp('fullName')}</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e?.target?.value || '')
              setProfileErrors({ ...profileErrors, name: '' })
            }}
            placeholder={tp('fullNamePlaceholder')}
            hasError={profileErrors?.name}
            className="h-10!"
          />
          {profileErrors?.name && (
            <span className="text-xs text-red-500">{profileErrors?.name}</span>
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
            hasError={profileErrors?.phone}
            className="h-10!"
          />
          {profileErrors?.phone && (
            <span className="text-xs text-red-500">{profileErrors?.phone}</span>
          )}
        </div>

        <button
          onClick={handleProfileSubmit}
          disabled={isUpdatingProfile}
          className={cn(
            'primary-btn w-44',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isUpdatingProfile ? tp('saving') : tp('save')}
        </button>
      </div>
    </div>
  )
})

export default PersonalInfoForm

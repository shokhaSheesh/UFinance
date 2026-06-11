'use client'
import { useTranslations } from 'next-intl'

const ProfileHeader = () => {
  const tp = useTranslations('Settings.profile')

  return (
    <h1 className="text-2xl sticky p-6 top-0 z-10 bg-white font-bold text-neutral-800">
      {tp('pageTitle')}
    </h1>
  )
}

export default ProfileHeader

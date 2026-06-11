'use client'
import { observer } from 'mobx-react-lite'
import PasswordChangeForm from '@/modules/settings/profile/components/PasswordChangeForm'
import ProfileHeader from '@/modules/settings/profile/components/ProfileHeader'

const ProfileSettingsPage = observer(() => {
  return (
    <div className="flex w-full flex-col gap-6  overflow-auto bg-white">
      <div className="flex-1">
        <ProfileHeader />
        {/* <PersonalInfoForm /> — hidden in original source */}
        <PasswordChangeForm />
      </div>
    </div>
  )
})

export default ProfileSettingsPage

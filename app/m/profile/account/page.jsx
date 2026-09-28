'use client'

import { MCard, MScreenHeader } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { authStore } from '@/store/auth.store'
import { formatPhoneNumber } from '@/utils/helpers'
import { useMutation } from '@tanstack/react-query'
import { ChevronRight, Loader2, Pencil } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

/**
 * Мой профиль: что записано и что из этого можно поменять.
 *
 * Отдельного «режима правки» нет — строка со стрелкой справа и есть
 * приглашение изменить значение, а строка без стрелки меняется только
 * администратором. Так не приходится гадать, где кнопка «Изменить», и
 * на экране нет лишнего шага.
 */

const UPLOAD_URL = 'https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png'
const CDN_BASE = 'https://cdn.u-code.io'
const MAX_PHOTO_SIZE = 5 * 1024 * 1024

/** Строка профиля: со стрелкой — изменяемая, без — только для чтения. */
const Row = ({ label, value, placeholder, onClick }) => {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0',
        onClick && 'active:bg-slate-50'
      )}
    >
      <span className="shrink-0 text-[15px] text-slate-500">{label}</span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-right text-[15px]',
          value ? 'font-medium text-slate-900' : 'text-slate-400'
        )}
      >
        {value || placeholder || '—'}
      </span>
      {onClick && <ChevronRight size={17} className="shrink-0 text-slate-300" aria-hidden="true" />}
    </Tag>
  )
}

const MobileAccountPage = observer(() => {
  const t = useTranslations('Mobile')
  const tp = useTranslations('Settings.profile')
  const router = useRouter()
  const mounted = useMounted()
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const user = authStore.userData || {}
  const name = user.name || user.login || ''
  const photo = user.photo || user.avatar || ''

  const { mutateAsync: saveProfile } = useMutation({
    mutationKey: ['update_branch_user'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'update_branch_user', data, type: 'role' }),
  })

  // Фото сохраняется сразу после выбора — отдельной кнопки не нужно
  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_PHOTO_SIZE) {
      showErrorNotification(t('profile.photoTooBig'))
      return
    }

    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file, file.name)
      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authStore.authToken}` },
        body,
      })
      if (!response.ok) throw new Error(t('profile.photoFailed'))
      const json = await response.json()
      const link = `${CDN_BASE}/${json?.data?.link}`

      await saveProfile({ guid: user.id || user.guid, photo: link })
      authStore.setUserData({ photo: link })
      showSuccessNotification(t('profile.photoChanged'))
    } catch (error) {
      showErrorNotification(error?.message || t('profile.photoFailed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader title={tp('pageTitle')} onBack={() => router.push('/m/profile')} />

      {/* Фото — карандаш на кружке */}
      <div className="flex flex-col items-center gap-3 pb-6">
        <button type="button" onClick={() => fileRef.current?.click()} className="relative">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-[96px] w-[96px] rounded-full object-cover" />
          ) : (
            <span className="flex h-[96px] w-[96px] items-center justify-center rounded-full bg-[#0e73f6] text-[32px] font-bold text-white">
              {(mounted && name ? name : 'U').slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[#f4f5f7] bg-white text-slate-600">
            {uploading ? (
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            ) : (
              <Pencil size={13} aria-hidden="true" />
            )}
          </span>
        </button>
        <span className="text-[19px] font-bold text-slate-900">{mounted ? name : ''}</span>
        <input ref={fileRef} type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
      </div>

      {/* Личные данные — со стрелками, значит меняются */}
      <div className="px-1 pb-2.5 text-[15px] font-bold text-slate-900">{t('profile.personal')}</div>
      <MCard list>
        <Row
          label={t('profile.fullName')}
          value={mounted ? name : ''}
          onClick={() => router.push('/m/profile/account/field?field=name')}
        />
        <Row
          label={t('profile.phone')}
          value={mounted ? formatPhoneNumber(user.phone || '') : ''}
          placeholder={t('profile.noPhone')}
          onClick={() => router.push('/m/profile/account/phone')}
        />
        <Row
          label="Email"
          value={user.email}
          onClick={() => router.push('/m/profile/account/field?field=email')}
        />
      </MCard>

      {/* Безопасность */}
      <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{t('profile.securityGroup')}</div>
      <MCard list>
        <Row
          label={tp('password.title')}
          value="••••••"
          onClick={() => router.push('/m/profile/account/password')}
        />
      </MCard>

      {/* Без стрелок: это назначает администратор */}
      <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{t('profile.workspace')}</div>
      <MCard list>
        <Row label={t('profile.role')} value={user.role_name || user.role} />
        <Row label={t('profile.branch')} value={authStore.selectBranch?.name} />
      </MCard>
      <p className="px-2 pt-2 text-[11px] leading-relaxed text-slate-400">{t('profile.workspaceHint')}</p>
    </div>
  )
})

export default MobileAccountPage

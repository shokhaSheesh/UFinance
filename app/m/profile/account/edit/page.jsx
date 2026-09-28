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
 * Изменение профиля списком, а не формой.
 *
 * Каждая строка показывает, что записано сейчас, и открывает свой экран
 * правки: на телефоне одно поле на экран заполняется увереннее, чем
 * длинная форма, где легко промахнуться по соседнему полю и не заметить.
 * Фото меняется прямо здесь — карандашом на кружке.
 */

const UPLOAD_URL = 'https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png'
const CDN_BASE = 'https://cdn.u-code.io'
const MAX_PHOTO_SIZE = 5 * 1024 * 1024

/** Строка «подпись — значение — шеврон». */
const EditRow = ({ label, value, placeholder, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
  >
    <span className="shrink-0 text-[15px] text-slate-700">{label}</span>
    <span
      className={cn(
        'min-w-0 flex-1 truncate text-right text-[15px]',
        value ? 'font-medium text-slate-900' : 'text-slate-400'
      )}
    >
      {value || placeholder}
    </span>
    <ChevronRight size={17} className="shrink-0 text-slate-300" aria-hidden="true" />
  </button>
)

const MobileAccountEditPage = observer(() => {
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

  // Фото сохраняется сразу: отдельной кнопки «Сохранить» на этом экране нет
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
      <MScreenHeader title={t('profile.editTitle')} onBack={() => router.back()} />

      {/* Фото */}
      <div className="flex justify-center pb-6">
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
        <input ref={fileRef} type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
      </div>

      {/* Что можно изменить */}
      <MCard list>
        <EditRow
          label={t('profile.fullName')}
          value={mounted ? name : ''}
          placeholder={t('form.choose')}
          onClick={() => router.push('/m/profile/account/field?field=name')}
        />
        <EditRow
          label="Email"
          value={user.email}
          placeholder={t('form.choose')}
          onClick={() => router.push('/m/profile/account/field?field=email')}
        />
        <EditRow
          label={t('profile.phone')}
          value={mounted ? formatPhoneNumber(user.phone || '') : ''}
          placeholder={t('profile.noPhone')}
          onClick={() => router.push('/m/profile/account/phone')}
        />
      </MCard>

      {/* Безопасность */}
      <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{t('profile.securityGroup')}</div>
      <MCard list>
        <EditRow
          label={tp('password.change')}
          value=""
          placeholder="••••••"
          onClick={() => router.push('/m/profile/account/password')}
        />
      </MCard>

      <p className="px-2 pt-4 text-[11px] leading-relaxed text-slate-400">{t('profile.workspaceHint')}</p>
    </div>
  )
})

export default MobileAccountEditPage

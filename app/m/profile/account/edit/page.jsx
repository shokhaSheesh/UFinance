'use client'

import { MFieldRow } from '@/components/mobile/fields'
import { MCard, MRow, MScreenHeader } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { authStore } from '@/store/auth.store'
import { formatPhoneNumber } from '@/utils/helpers'
import { useMutation } from '@tanstack/react-query'
import { Camera, Loader2, Phone } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

/**
 * Правка профиля: фото, имя и почта.
 *
 * Телефон отсюда не меняется — он подтверждается кодом, поэтому ведёт на
 * свой экран. Так форма остаётся простой: нажал «Сохранить» — и всё
 * сохранилось, без половинчатых состояний «имя записано, телефон ждёт
 * подтверждения».
 */

const UPLOAD_URL = 'https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png'
const CDN_BASE = 'https://cdn.u-code.io'
const MAX_PHOTO_SIZE = 5 * 1024 * 1024

const MobileAccountEditPage = observer(() => {
  const t = useTranslations('Mobile')
  const tp = useTranslations('Settings.profile')
  const tc = useTranslations('Common')
  const router = useRouter()
  const mounted = useMounted()
  const fileRef = useRef(null)

  const user = authStore.userData || {}

  const [name, setName] = useState(user.name || user.login || '')
  const [email, setEmail] = useState(user.email || '')
  const [photo, setPhoto] = useState(user.photo || user.avatar || '')
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState({})

  const { mutateAsync: saveProfile, isPending: saving } = useMutation({
    mutationKey: ['update_branch_user'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'update_branch_user', data, type: 'role' }),
  })

  const pickPhoto = () => fileRef.current?.click()

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
      setPhoto(`${CDN_BASE}/${json?.data?.link}`)
    } catch (error) {
      showErrorNotification(error?.message || t('profile.photoFailed'))
    } finally {
      setUploading(false)
    }
  }

  const submit = async () => {
    const found = {}
    if (!name.trim()) found.name = tc('required')
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) found.email = t('profile.emailInvalid')
    setErrors(found)
    if (Object.keys(found).length) return

    try {
      await saveProfile({ guid: user.id || user.guid, name: name.trim(), email, photo })
      authStore.setUserData({ name: name.trim(), email, photo })
      showSuccessNotification(tc('saved'))
      router.push('/m/profile/account')
    } catch (error) {
      showErrorNotification(error?.message || t('form.saveFailed'))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader title={t('profile.editTitle')} onBack={() => router.back()} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {/* Фото */}
        <div className="flex flex-col items-center gap-3 pb-5">
          <button type="button" onClick={pickPhoto} className="relative">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-[88px] w-[88px] rounded-[28px] object-cover" />
            ) : (
              <span className="flex h-[88px] w-[88px] items-center justify-center rounded-[28px] bg-[#0e73f6] text-[30px] font-bold text-white">
                {(mounted && name ? name : 'U').slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="absolute -right-1 -bottom-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-[#f4f5f7] bg-white text-slate-600">
              {uploading ? (
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              ) : (
                <Camera size={15} aria-hidden="true" />
              )}
            </span>
          </button>
          <button type="button" onClick={pickPhoto} className="text-[13px] font-semibold text-[#0e73f6]">
            {t('profile.changePhoto')}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
        </div>

        {/* Имя и почта */}
        <div className="flex flex-col gap-2">
          <MFieldRow label={t('profile.fullName')} required error={errors.name}>
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setErrors({ ...errors, name: '' })
              }}
              placeholder={t('profile.fullName')}
              className="w-full bg-transparent text-[16px] font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            />
          </MFieldRow>

          <MFieldRow label="Email" error={errors.email}>
            <input
              value={email}
              inputMode="email"
              autoCapitalize="off"
              onChange={(event) => {
                setEmail(event.target.value)
                setErrors({ ...errors, email: '' })
              }}
              placeholder="mail@example.com"
              className="w-full bg-transparent text-[16px] font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            />
          </MFieldRow>
        </div>

        {/* Телефон меняется с подтверждением кодом */}
        <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{t('profile.phone')}</div>
        <MCard list>
          <MRow
            icon={Phone}
            title={mounted ? formatPhoneNumber(user.phone || '') || t('profile.noPhone') : ''}
            subtitle={t('profile.changePhoneHint')}
            chevron
            onClick={() => router.push('/m/profile/account/phone')}
          />
        </MCard>

        <p className="px-2 pt-6 text-[11px] leading-relaxed text-slate-400">{tp('pageTitle')}</p>
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <button
          type="button"
          onClick={submit}
          disabled={saving || uploading}
          className={cn(
            'flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#0e73f6] py-4 text-[16px] font-semibold text-white',
            'active:bg-[#0b5fd4] disabled:opacity-60'
          )}
        >
          {saving && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
          {tc('save')}
        </button>
      </div>
    </div>
  )
})

export default MobileAccountEditPage

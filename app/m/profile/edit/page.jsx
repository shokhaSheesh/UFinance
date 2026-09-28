'use client'

import { MFieldRow, MPasswordField } from '@/components/mobile/fields'
import { MCard, MScreenHeader } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import useMounted from '@/hooks/useMounted'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { useResetPassword } from '@/modules/settings/profile/hooks/useProfileData'
import { authStore } from '@/store/auth.store'
import { formatPhoneNumber } from '@/utils/helpers'
import { useMutation } from '@tanstack/react-query'
import { Camera, Loader2, ShieldCheck } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

/**
 * Мой профиль на телефоне: имя, фото, телефон и почта.
 *
 * Роль и филиал правит администратор рабочего пространства, поэтому они
 * показаны строками, а не полями. Пароль меняется здесь же, но своей
 * кнопкой: это отдельное действие с отдельными правилами, и путать его с
 * сохранением имени не стоит.
 */

const UPLOAD_URL = 'https://api.admin.u-code.io/v1/files/folder_upload?folder_name=Media&format=png'
const CDN_BASE = 'https://cdn.u-code.io'
const MAX_PHOTO_SIZE = 5 * 1024 * 1024

/** Строка «подпись — значение» для того, что менять нельзя. */
const Line = ({ label, value }) => {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="shrink-0 text-[13px] text-slate-500">{label}</span>
      <span className="min-w-0 text-right text-[14px] font-medium text-slate-900">{value}</span>
    </div>
  )
}

const MobileProfileEditPage = observer(() => {
  const t = useTranslations('Mobile')
  const tp = useTranslations('Settings.profile')
  const tc = useTranslations('Common')
  const router = useRouter()
  const mounted = useMounted()
  const fileRef = useRef(null)

  const user = authStore.userData || {}

  const [name, setName] = useState(user.name || user.login || '')
  const [phone, setPhone] = useState(formatPhoneNumber(user.phone || ''))
  const [email, setEmail] = useState(user.email || '')
  const [photo, setPhoto] = useState(user.photo || user.avatar || '')
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState({})

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordErrors, setPasswordErrors] = useState({})

  const { mutateAsync: resetPassword, isPending: changingPassword } = useResetPassword()

  const { mutateAsync: saveProfile, isPending: saving } = useMutation({
    mutationKey: ['update_branch_user'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'update_branch_user', data, type: 'role' }),
  })

  // ── Фото ──────────────────────────────────────────────────────────────────
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

  // ── Сохранение личных данных ──────────────────────────────────────────────
  const submitProfile = async () => {
    const found = {}
    if (!name.trim()) found.name = tc('required')
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) found.email = t('profile.emailInvalid')
    setErrors(found)
    if (Object.keys(found).length) return

    try {
      await saveProfile({
        guid: user.id || user.guid,
        name: name.trim(),
        email,
        phone: phone.replace(/\D/g, ''),
        photo,
      })
      authStore.setUserData({ name: name.trim(), email, phone: phone.replace(/\D/g, ''), photo })
      showSuccessNotification(tc('saved'))
    } catch (error) {
      showErrorNotification(error?.message || t('form.saveFailed'))
    }
  }

  // ── Смена пароля ──────────────────────────────────────────────────────────
  const submitPassword = async () => {
    const found = {}
    if (!current) found.current = tp('password.errors.currentRequired')
    if (!next) found.next = tp('password.errors.newRequired')
    else if (next.length < 6) found.next = tp('password.errors.minLength')
    else if (!/[A-Z]/.test(next)) found.next = tp('password.errors.uppercase')
    else if (!/[a-z]/.test(next)) found.next = tp('password.errors.lowercase')
    else if (!/[0-9]/.test(next)) found.next = tp('password.errors.number')
    if (!confirm) found.confirm = tp('password.errors.confirmRequired')
    else if (confirm !== next) found.confirm = tp('password.errors.match')
    setPasswordErrors(found)
    if (Object.keys(found).length) return

    try {
      await resetPassword({ old_password: current, password: next })
      showSuccessNotification(tp('password.success'))
      setCurrent('')
      setNext('')
      setConfirm('')
      setPasswordErrors({})
    } catch (error) {
      showErrorNotification(error?.message || tp('password.error'))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader title={tp('pageTitle')} onBack={() => router.back()} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {/* Фото */}
        <div className="flex flex-col items-center gap-3 pb-4">
          <button type="button" onClick={pickPhoto} className="relative">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt=""
                className="h-[88px] w-[88px] rounded-[28px] object-cover"
              />
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

        {/* Личные данные */}
        <div className="px-1 pb-2.5 text-[15px] font-bold text-slate-900">{t('profile.personal')}</div>
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

          <MFieldRow label={t('profile.phone')}>
            <input
              value={phone}
              inputMode="tel"
              onChange={(event) => setPhone(formatPhoneNumber(event.target.value))}
              placeholder="+998"
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

        {/* Роль и филиал меняет администратор */}
        <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{t('profile.workspace')}</div>
        <MCard list>
          <Line label={t('profile.role')} value={user.role_name || user.role} />
          <Line label={t('profile.branch')} value={authStore.selectBranch?.name} />
        </MCard>
        <p className="px-2 pt-2 text-[11px] leading-relaxed text-slate-400">{t('profile.workspaceHint')}</p>

        {/* Смена пароля */}
        <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{tp('password.title')}</div>
        <div className="flex flex-col gap-2">
          <MPasswordField
            label={tp('password.current')}
            placeholder={tp('password.currentPlaceholder')}
            value={current}
            onChange={(value) => {
              setCurrent(value)
              setPasswordErrors({ ...passwordErrors, current: '' })
            }}
            error={passwordErrors.current}
            autoComplete="current-password"
          />
          <MPasswordField
            label={tp('password.new')}
            placeholder={tp('password.newPlaceholder')}
            value={next}
            onChange={(value) => {
              setNext(value)
              setPasswordErrors({ ...passwordErrors, next: '' })
            }}
            error={passwordErrors.next}
            autoComplete="new-password"
          />
          <MPasswordField
            label={tp('password.confirm')}
            placeholder={tp('password.confirmPlaceholder')}
            value={confirm}
            onChange={(value) => {
              setConfirm(value)
              setPasswordErrors({ ...passwordErrors, confirm: '' })
            }}
            error={passwordErrors.confirm}
            autoComplete="new-password"
          />
        </div>

        <div className="mt-2 flex items-start gap-2 rounded-2xl bg-white px-4 py-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="text-[12px] leading-relaxed text-slate-500">{t('profile.passwordRules')}</span>
        </div>

        <button
          type="button"
          onClick={submitPassword}
          disabled={changingPassword}
          className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-[#0e73f6] active:bg-slate-100 disabled:opacity-60"
        >
          {changingPassword && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {tp('password.change')}
        </button>
      </div>

      {/* Сохранение личных данных */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <button
          type="button"
          onClick={submitProfile}
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

export default MobileProfileEditPage

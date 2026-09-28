'use client'

import { MPasswordField } from '@/components/mobile/fields'
import { MCard, MScreenHeader } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import useMounted from '@/hooks/useMounted'
import { cn } from '@/lib/utils'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { useResetPassword } from '@/modules/settings/profile/hooks/useProfileData'
import { authStore } from '@/store/auth.store'
import { Loader2, ShieldCheck, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

/**
 * Мой профиль на телефоне.
 *
 * Имя, почту и телефон заводит администратор рабочего пространства — их
 * показываем как есть, без полей ввода, чтобы не обещать правку, которой
 * нет. Менять с телефона можно то же, что и на большом экране: пароль.
 * Правила пароля написаны рядом с полем, а не всплывают ошибкой после
 * нажатия «Сохранить».
 */

/** Строка «подпись — значение» карточки личных данных. */
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
  const router = useRouter()
  const mounted = useMounted()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})

  const { mutateAsync: resetPassword, isPending } = useResetPassword()

  const user = authStore.userData || {}
  const name = user.name || user.login || ''

  // Правила те же, что на большом экране: длина, регистры и цифра
  const validate = () => {
    const found = {}
    if (!current) found.current = tp('password.errors.currentRequired')
    if (!next) found.next = tp('password.errors.newRequired')
    else if (next.length < 6) found.next = tp('password.errors.minLength')
    else if (!/[A-Z]/.test(next)) found.next = tp('password.errors.uppercase')
    else if (!/[a-z]/.test(next)) found.next = tp('password.errors.lowercase')
    else if (!/[0-9]/.test(next)) found.next = tp('password.errors.number')
    if (!confirm) found.confirm = tp('password.errors.confirmRequired')
    else if (confirm !== next) found.confirm = tp('password.errors.match')
    setErrors(found)
    return Object.keys(found).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    try {
      await resetPassword({ old_password: current, password: next })
      showSuccessNotification(tp('password.success'))
      setCurrent('')
      setNext('')
      setConfirm('')
      setErrors({})
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
        {/* Кто вошёл */}
        <div className="flex flex-col items-center gap-3 pb-2">
          <span className="flex h-[76px] w-[76px] items-center justify-center rounded-[24px] bg-[#0e73f6] text-[26px] font-bold text-white">
            {(mounted && name ? name : 'U').slice(0, 1).toUpperCase()}
          </span>
          <span className="text-[17px] font-bold text-slate-900">{mounted ? name : ''}</span>
        </div>

        {/* Личные данные — их заводит администратор */}
        <div className="px-1 pt-4 pb-2.5 text-[15px] font-bold text-slate-900">{t('profile.personal')}</div>
        <MCard list>
          <Line label={t('profile.fullName')} value={mounted ? name : ''} />
          <Line label="Email" value={user.email} />
          <Line label={t('profile.phone')} value={user.phone} />
          <Line label={t('profile.role')} value={user.role_name || user.role} />
          <Line label={t('profile.branch')} value={authStore.selectBranch?.name} />
        </MCard>
        <p className="px-2 pt-2 text-[11px] leading-relaxed text-slate-400">{t('profile.personalHint')}</p>

        {/* Смена пароля */}
        <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{tp('password.title')}</div>
        <div className="flex flex-col gap-2">
          <MPasswordField
            label={tp('password.current')}
            placeholder={tp('password.currentPlaceholder')}
            value={current}
            onChange={(value) => {
              setCurrent(value)
              setErrors({ ...errors, current: '' })
            }}
            error={errors.current}
            autoComplete="current-password"
          />
          <MPasswordField
            label={tp('password.new')}
            placeholder={tp('password.newPlaceholder')}
            value={next}
            onChange={(value) => {
              setNext(value)
              setErrors({ ...errors, next: '' })
            }}
            error={errors.next}
            autoComplete="new-password"
          />
          <MPasswordField
            label={tp('password.confirm')}
            placeholder={tp('password.confirmPlaceholder')}
            value={confirm}
            onChange={(value) => {
              setConfirm(value)
              setErrors({ ...errors, confirm: '' })
            }}
            error={errors.confirm}
            autoComplete="new-password"
          />
        </div>

        <div className="mt-2 flex items-start gap-2 rounded-2xl bg-white px-4 py-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="text-[12px] leading-relaxed text-slate-500">{t('profile.passwordRules')}</span>
        </div>

        {/* Удаление аккаунта */}
        <div className="pt-6">
          <MCard list>
            <button
              type="button"
              onClick={() => router.push('/delete-account')}
              className="flex w-full items-center gap-3 py-3.5 text-left active:bg-red-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-red-600">{t('profile.deleteAccount')}</span>
                <span className="mt-0.5 block text-[12px] text-slate-500">{t('profile.deleteAccountHint')}</span>
              </span>
            </button>
          </MCard>
        </div>
      </div>

      {/* Сохранение пароля */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className={cn(
            'flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#0e73f6] py-4 text-[16px] font-semibold text-white',
            'active:bg-[#0b5fd4] disabled:opacity-60'
          )}
        >
          {isPending && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
          {tp('password.change')}
        </button>
      </div>
    </div>
  )
})

export default MobileProfileEditPage

'use client'

import { MPasswordField } from '@/components/mobile/fields'
import { MScreenHeader } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { useResetPassword } from '@/modules/settings/profile/hooks/useProfileData'
import { Loader2, ShieldCheck } from '@/components/mobile/icons'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

/**
 * Смена пароля — на своём экране.
 *
 * Правила пароля напечатаны рядом с полями, а не выпадают ошибкой после
 * нажатия: в трёх полях подряд промахнуться легко, и подсказка нужна до,
 * а не после.
 */
const MobilePasswordPage = () => {
  const t = useTranslations('Mobile')
  const tp = useTranslations('Settings.profile')
  const router = useRouter()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})

  const { mutateAsync: resetPassword, isPending } = useResetPassword()

  const submit = async () => {
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
    if (Object.keys(found).length) return

    try {
      await resetPassword({ old_password: current, password: next })
      showSuccessNotification(tp('password.success'))
      router.push('/m/profile/account')
    } catch (error) {
      showErrorNotification(error?.message || tp('password.error'))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader title={tp('password.title')} onBack={() => router.back()} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
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

        <div className="mt-2.5 flex items-start gap-2 rounded-2xl bg-white px-4 py-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="text-[12px] leading-relaxed text-slate-500">{t('profile.passwordRules')}</span>
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#0e73f6] py-4 text-[16px] font-semibold text-white active:bg-[#0b5fd4] disabled:opacity-60"
        >
          {isPending && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
          {tp('password.change')}
        </button>
      </div>
    </div>
  )
}

export default MobilePasswordPage

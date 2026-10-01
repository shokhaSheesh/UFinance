'use client'

import AuthArt from '@/components/mobile/AuthArt'
import { ArrowLeft, Check, Eye, EyeOff, Loader2 } from '@/components/mobile/icons'
import { useLogin, useRegister } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { formatPhoneNumber, getCleanPhoneNumber } from '@/utils/helpers'
import { useMutation } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

/**
 * Вход и регистрация на телефоне.
 *
 * Как в Revolut Business: приветственный экран с иллюстрацией и двумя
 * кнопками, дальше — один вопрос на экран: крупный заголовок, одно поле,
 * кнопка «Продолжить» внизу. У регистрации сверху полоска шагов.
 * Запросы те же, что у формы входа на компьютере (useLogin, useRegister,
 * auth_forgot_password); после входа открывается главная телефона.
 */

const EMAIL_RE = /\S+@\S+\.\S+/

// шаги регистрации: поле формы, заголовок, подсказка, проверка
const REGISTER_STEPS = [
  { key: 'branchName', title: 'companyTitle', hint: 'companyHint', error: 'branchNameRequired', autoComplete: 'organization' },
  { key: 'name', title: 'nameTitle', hint: 'nameHint', error: 'nameRequired', autoComplete: 'name' },
  { key: 'email', title: 'regEmailTitle', hint: 'regEmailHint', error: 'emailInvalid', type: 'email', autoComplete: 'email' },
  { key: 'phone', title: 'phoneTitle', hint: 'phoneHint', error: 'phoneIncomplete', type: 'tel', autoComplete: 'tel' },
]

const inputClass =
  'h-14 w-full rounded-2xl border bg-white px-4 text-[17px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0e73f6]'

export default function MobileAuthPage() {
  const t = useTranslations('Mobile.auth')
  const ta = useTranslations('Auth')
  const locale = useLocale()

  // welcome → login-email → login-password | forgot | register (шаги по индексу)
  const [screen, setScreen] = useState('welcome')
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ email: '', password: '', branchName: '', name: '', regEmail: '', phone: '+998', terms: false })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const loginMutation = useLogin({ redirectTo: '/m' })
  const registerMutation = useRegister({ redirectTo: '/m' })
  const forgotMutation = useMutation({
    mutationKey: ['auth_forgot_password'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'auth_forgot_password', data: { lang: locale, ...data } }),
  })
  const busy = loginMutation.isPending || registerMutation.isPending || forgotMutation.isPending

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const go = (next, nextStep = 0) => {
    setScreen(next)
    setStep(nextStep)
    setError('')
  }

  const back = () => {
    if (screen === 'register' && step > 0) return go('register', step - 1)
    if (screen === 'login-password' || screen === 'forgot') return go('login-email')
    go('welcome')
  }

  const submit = async (event) => {
    event?.preventDefault()
    if (busy) return

    if (screen === 'login-email' || screen === 'forgot') {
      if (!EMAIL_RE.test(form.email)) return setError(ta(form.email ? 'errors.emailInvalid' : 'errors.emailRequired'))
      if (screen === 'login-email') return go('login-password')
      try {
        await forgotMutation.mutateAsync({ email: form.email })
        showSuccessNotification(ta('notifications.forgotSuccess'))
        go('login-email')
      } catch (err) {
        showErrorNotification(err?.message || ta('notifications.forgotError'))
      }
      return
    }

    if (screen === 'login-password') {
      if (!form.password) return setError(ta('errors.passwordRequired'))
      // ошибку входа показывает сам хук уведомлением
      await loginMutation.mutateAsync({ email: form.email, password: form.password }).catch(() => {})
      return
    }

    if (screen === 'register') {
      const current = REGISTER_STEPS[step]
      const field = current.key === 'email' ? 'regEmail' : current.key
      const value = form[field]
      const valid =
        current.key === 'email'
          ? EMAIL_RE.test(value)
          : current.key === 'phone'
            ? getCleanPhoneNumber(value).length === 12
            : value.trim().length > 0
      if (!valid) return setError(ta(`errors.${current.key === 'email' && !value ? 'emailRequired' : current.error}`))
      if (step < REGISTER_STEPS.length - 1) return go('register', step + 1)
      if (!form.terms) return setError(ta('errors.termsRequired'))

      await registerMutation
        .mutateAsync({
          name: form.name.trim(),
          email: form.regEmail.trim(),
          phone: getCleanPhoneNumber(form.phone),
          legal_entity_name: form.name.trim(),
          branch_name: form.branchName.trim(),
        })
        .catch(() => {})
    }
  }

  if (screen === 'welcome') {
    return (
      <div className="flex h-full flex-col bg-white px-5 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)]">
        <div className="flex items-center gap-2 pt-2">
          <span className="text-[22px] leading-none font-black tracking-tight">
            <span className="text-[#0e73f6]">U</span>
            <span className="text-slate-900">F</span>
          </span>
          <span className="text-[15px] font-semibold text-slate-900">UFinance</span>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          <AuthArt size={290} />
        </div>

        <h1 className="text-[32px] leading-[1.12] font-bold tracking-tight text-slate-900">{t('welcomeTitle')}</h1>
        <p className="mt-3 text-[16px] leading-snug text-slate-500">{t('welcomeHint')}</p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => go('register', 0)}
            className="h-14 rounded-full bg-[#0e73f6] text-[16px] font-semibold text-white transition-colors active:bg-[#0b5fd4]"
          >
            {t('createAccount')}
          </button>
          <button
            type="button"
            onClick={() => go('login-email')}
            className="h-14 rounded-full bg-slate-100 text-[16px] font-semibold text-slate-900 transition-colors active:bg-slate-200"
          >
            {t('login')}
          </button>
        </div>
      </div>
    )
  }

  // Заголовок, подсказка и поле текущего экрана
  let title = ''
  let hint = ''
  let field = null
  let action = t('continue')

  if (screen === 'login-email' || screen === 'forgot') {
    title = screen === 'forgot' ? t('forgotTitle') : t('emailTitle')
    hint = screen === 'forgot' ? t('forgotHint') : t('emailHint')
    if (screen === 'forgot') action = t('send')
    field = (
      <input
        autoFocus
        type="email"
        inputMode="email"
        autoComplete="email"
        value={form.email}
        onChange={(event) => set('email', event.target.value.trim())}
        placeholder={ta('fields.email')}
        className={cn(inputClass, error ? 'border-rose-400' : 'border-slate-200')}
      />
    )
  } else if (screen === 'login-password') {
    title = t('passwordTitle')
    hint = t('passwordHint', { email: form.email })
    action = t('login')
    field = (
      <>
        <div className="relative">
          <input
            autoFocus
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => set('password', event.target.value)}
            placeholder={ta('fields.password')}
            className={cn(inputClass, 'pr-14', error ? 'border-rose-400' : 'border-slate-200')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={ta('fields.password')}
            className="absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 active:bg-slate-100"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <button type="button" onClick={() => go('forgot')} className="mt-4 text-[15px] font-semibold text-[#0e73f6]">
          {t('forgot')}
        </button>
      </>
    )
  } else {
    const current = REGISTER_STEPS[step]
    const key = current.key === 'email' ? 'regEmail' : current.key
    const last = step === REGISTER_STEPS.length - 1
    title = t(current.title)
    hint = t(current.hint)
    if (last) action = t('register')
    field = (
      <>
        <input
          // новый ключ — новое поле: фокус переходит на него при смене шага
          key={current.key}
          autoFocus
          type={current.type || 'text'}
          inputMode={current.type === 'tel' ? 'tel' : current.type === 'email' ? 'email' : undefined}
          autoComplete={current.autoComplete}
          value={form[key]}
          onChange={(event) =>
            set(key, current.key === 'phone' ? formatPhoneNumber(event.target.value) : event.target.value)
          }
          placeholder={ta(`fields.${current.key}`)}
          className={cn(inputClass, error ? 'border-rose-400' : 'border-slate-200')}
        />
        {last && (
          <label className="mt-5 flex items-start gap-3 text-[14px] leading-snug text-slate-600">
            <button
              type="button"
              role="checkbox"
              aria-checked={form.terms}
              onClick={() => set('terms', !form.terms)}
              className={cn(
                'mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border transition-colors',
                form.terms ? 'border-[#0e73f6] bg-[#0e73f6] text-white' : 'border-slate-300 bg-white'
              )}
            >
              {form.terms && <Check size={14} />}
            </button>
            <span>
              {ta('termsCheckboxPrefix')}
              {ta('termsCheckboxAccent')}
              {ta('termsCheckboxSuffix')}
            </span>
          </label>
        )}
      </>
    )
  }

  return (
    <form onSubmit={submit} className="flex h-full flex-col bg-[#f4f5f7]">
      <div className="flex items-center gap-3 px-3 pt-[max(env(safe-area-inset-top),12px)]">
        <button
          type="button"
          onClick={back}
          aria-label={t('back')}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-900 active:bg-slate-200"
        >
          <ArrowLeft size={22} />
        </button>
        {/* полоска шагов регистрации */}
        {screen === 'register' && (
          <div className="mr-3 flex flex-1 gap-1.5" aria-label={t('step', { n: step + 1, total: REGISTER_STEPS.length })}>
            {REGISTER_STEPS.map((item, index) => (
              <span
                key={item.key}
                className={cn('h-1 flex-1 rounded-full transition-colors', index <= step ? 'bg-[#0e73f6]' : 'bg-slate-200')}
              />
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4">
        <h1 className="text-[30px] leading-[1.15] font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 mb-6 text-[15px] leading-snug text-slate-500">{hint}</p>
        {field}
        {error && <p className="mt-2 px-1 text-[13px] text-rose-500">{error}</p>}
      </div>

      <div className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)]">
        <button
          type="submit"
          disabled={busy}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#0e73f6] text-[16px] font-semibold text-white transition-colors active:bg-[#0b5fd4] disabled:opacity-60"
        >
          {busy && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
          {action}
        </button>
        {(screen === 'login-email' || screen === 'register') && (
          <p className="mt-4 text-center text-[14px] text-slate-500">
            {screen === 'register' ? t('hasAccount') : t('noAccount')}{' '}
            <button
              type="button"
              onClick={() => go(screen === 'register' ? 'login-email' : 'register', 0)}
              className="font-semibold text-[#0e73f6]"
            >
              {screen === 'register' ? t('login') : t('createAccount')}
            </button>
          </p>
        )}
      </div>
    </form>
  )
}

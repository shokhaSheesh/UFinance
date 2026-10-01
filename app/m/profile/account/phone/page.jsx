'use client'

import { MFieldRow } from '@/components/mobile/fields'
import { MScreenHeader } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import { apiClient } from '@/lib/api/ucode/base'
import { cn } from '@/lib/utils'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { authStore } from '@/store/auth.store'
import { formatPhoneNumber, getCleanPhoneNumber } from '@/utils/helpers'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from '@/components/mobile/icons'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

/**
 * Смена номера телефона в два шага: номер, затем код из СМС.
 *
 * Телефон — это способ входа и связи, поэтому новый номер подтверждается
 * кодом, а не сохраняется вместе с именем. Шаги разделены: на первом
 * вводят номер, на втором — шесть цифр, и повторная отправка доступна не
 * сразу, чтобы не слать СМС очередями.
 */

const CODE_LENGTH = 6
const RESEND_SECONDS = 60

const MobilePhoneChangePage = observer(() => {
  const t = useTranslations('Mobile')
  const tc = useTranslations('Common')
  const router = useRouter()

  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState(formatPhoneNumber(authStore.userData?.phone || ''))
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(0)
  const codeRef = useRef(null)

  // Обратный отсчёт до повторной отправки
  useEffect(() => {
    if (seconds <= 0) return
    const timer = setInterval(() => setSeconds((value) => Math.max(value - 1, 0)), 1000)
    return () => clearInterval(timer)
  }, [seconds])

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus()
  }, [step])

  // Отправка и проверка кода: методы бэка для подтверждения телефона
  const { mutateAsync: sendCode, isPending: sending } = useMutation({
    mutationKey: ['send_phone_code'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'auth_send_phone_code', data }),
  })

  const { mutateAsync: verifyCode, isPending: verifying } = useMutation({
    mutationKey: ['verify_phone_code'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'auth_verify_phone_code', data }),
  })

  const cleanPhone = getCleanPhoneNumber(phone)

  const requestCode = async () => {
    if (cleanPhone.length < 9) {
      setError(t('profile.phoneInvalid'))
      return
    }
    setError('')
    try {
      await sendCode({ phone: cleanPhone })
      setSeconds(RESEND_SECONDS)
      setStep('code')
    } catch (requestError) {
      showErrorNotification(requestError?.message || t('profile.codeFailed'))
    }
  }

  const confirmCode = async () => {
    if (code.length < CODE_LENGTH) {
      setError(t('profile.codeInvalid'))
      return
    }
    setError('')
    try {
      await verifyCode({ phone: cleanPhone, code })
      authStore.setUserData({ phone: cleanPhone })
      showSuccessNotification(t('profile.phoneChanged'))
      router.push('/m/profile/account')
    } catch (verifyError) {
      setError(verifyError?.message || t('profile.codeWrong'))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader
          title={step === 'phone' ? t('profile.changePhone') : t('profile.codeTitle')}
          subtitle={step === 'code' ? t('profile.codeSent', { phone: formatPhoneNumber(cleanPhone) }) : null}
          onBack={() => (step === 'code' ? setStep('phone') : router.back())}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {step === 'phone' ? (
          <>
            <MFieldRow label={t('profile.newPhone')} required error={error}>
              <input
                autoFocus
                value={phone}
                inputMode="tel"
                onChange={(event) => {
                  setPhone(formatPhoneNumber(event.target.value))
                  setError('')
                }}
                placeholder="+998 90 123 45 67"
                className="w-full bg-transparent text-[18px] font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
            </MFieldRow>
            <p className="px-2 pt-2.5 text-[12px] leading-relaxed text-slate-500">{t('profile.phoneHint')}</p>
          </>
        ) : (
          <>
            {/* Шесть клеток под код: одно поле, клетки — только оформление */}
            <button
              type="button"
              onClick={() => codeRef.current?.focus()}
              className="flex w-full justify-between gap-2"
            >
              {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    'flex h-14 flex-1 items-center justify-center rounded-2xl bg-white text-[22px] font-bold text-slate-900',
                    index === code.length && 'ring-2 ring-[#0e73f6]',
                    error && 'ring-2 ring-red-300'
                  )}
                >
                  {code[index] || ''}
                </span>
              ))}
            </button>

            <input
              ref={codeRef}
              value={code}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))
                setError('')
              }}
              className="sr-only"
            />

            {error && <p className="px-2 pt-2.5 text-[12px] text-red-600">{error}</p>}

            <div className="flex justify-center pt-5">
              {seconds > 0 ? (
                <span className="text-[13px] text-slate-500">
                  {t('profile.resendIn', { seconds: `0:${String(seconds).padStart(2, '0')}` })}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={requestCode}
                  disabled={sending}
                  className="text-[13px] font-semibold text-[#0e73f6] disabled:opacity-60"
                >
                  {t('profile.resend')}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <button
          type="button"
          onClick={step === 'phone' ? requestCode : confirmCode}
          disabled={sending || verifying}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#0e73f6] py-4 text-[16px] font-semibold text-white active:bg-[#0b5fd4] disabled:opacity-60"
        >
          {(sending || verifying) && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
          {step === 'phone' ? t('profile.getCode') : tc('save')}
        </button>
      </div>
    </div>
  )
})

export default MobilePhoneChangePage

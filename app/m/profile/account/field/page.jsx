'use client'

import { MFieldRow } from '@/components/mobile/fields'
import { MScreenHeader } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import { apiClient } from '@/lib/api/ucode/base'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { authStore } from '@/store/auth.store'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from '@/components/mobile/icons'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

/**
 * Одно поле профиля — один экран.
 *
 * Имя и почта правятся по отдельности: экран открывается уже с
 * клавиатурой и одним полем, ошибиться не в чем. Сохранение возвращает на
 * список, где сразу видно новое значение.
 */
const MobileAccountFieldPage = observer(() => {
  const t = useTranslations('Mobile')
  const tc = useTranslations('Common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const field = searchParams.get('field') === 'email' ? 'email' : 'name'

  const user = authStore.userData || {}
  const [value, setValue] = useState(field === 'email' ? user.email || '' : user.name || user.login || '')
  const [error, setError] = useState('')

  const { mutateAsync: saveProfile, isPending } = useMutation({
    mutationKey: ['update_branch_user'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'update_branch_user', data, type: 'role' }),
  })

  const label = field === 'email' ? 'Email' : t('profile.fullName')

  const submit = async () => {
    const clean = value.trim()
    if (field === 'name' && !clean) {
      setError(tc('required'))
      return
    }
    if (field === 'email' && clean && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError(t('profile.emailInvalid'))
      return
    }

    try {
      await saveProfile({ guid: user.id || user.guid, [field]: clean })
      authStore.setUserData({ [field]: clean })
      showSuccessNotification(tc('saved'))
      router.back()
    } catch (saveError) {
      showErrorNotification(saveError?.message || t('form.saveFailed'))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader title={label} onBack={() => router.back()} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        <MFieldRow label={label} required={field === 'name'} error={error}>
          <input
            autoFocus
            value={value}
            inputMode={field === 'email' ? 'email' : 'text'}
            autoCapitalize={field === 'email' ? 'off' : 'words'}
            onChange={(event) => {
              setValue(event.target.value)
              setError('')
            }}
            placeholder={field === 'email' ? 'mail@example.com' : t('profile.fullName')}
            className="w-full bg-transparent text-[18px] font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
        </MFieldRow>

        <p className="px-2 pt-2.5 text-[12px] leading-relaxed text-slate-500">
          {field === 'email' ? t('profile.emailHint') : t('profile.nameHint')}
        </p>
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#0e73f6] py-4 text-[16px] font-semibold text-white active:bg-[#0b5fd4] disabled:opacity-60"
        >
          {isPending && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
          {tc('save')}
        </button>
      </div>
    </div>
  )
})

export default MobileAccountFieldPage

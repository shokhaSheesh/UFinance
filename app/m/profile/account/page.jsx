'use client'

import { MCard, MRow, MScreenHeader } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import useMounted from '@/hooks/useMounted'
import { authStore } from '@/store/auth.store'
import { formatPhoneNumber } from '@/utils/helpers'
import { KeyRound, Pencil, Phone } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'

/**
 * Мой профиль — сначала просто карточка: кто я, что обо мне записано.
 *
 * Правка живёт на отдельном экране: на просмотровом не нужно бояться
 * задеть поле, а форма открывается осознанно — как в банковских
 * приложениях, где «Изменить» уводит на свой экран.
 */

/** Строка «подпись — значение». */
const Line = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
    <span className="shrink-0 text-[13px] text-slate-500">{label}</span>
    <span className="min-w-0 text-right text-[14px] font-medium text-slate-900">{value || '—'}</span>
  </div>
)

const MobileAccountPage = observer(() => {
  const t = useTranslations('Mobile')
  const tp = useTranslations('Settings.profile')
  const tc = useTranslations('Common')
  const router = useRouter()
  const mounted = useMounted()

  const user = authStore.userData || {}
  const name = user.name || user.login || ''
  const photo = user.photo || user.avatar || ''

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader
        title={tp('pageTitle')}
        onBack={() => router.push('/m/profile')}
        action={
          <button
            type="button"
            onClick={() => router.push('/m/profile/account/edit')}
            className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-semibold text-[#0e73f6] active:bg-slate-100"
          >
            <Pencil size={15} aria-hidden="true" />
            {tc('edit')}
          </button>
        }
      />

      {/* Кто я */}
      <div className="flex flex-col items-center gap-3 pb-5">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-[88px] w-[88px] rounded-[28px] object-cover" />
        ) : (
          <span className="flex h-[88px] w-[88px] items-center justify-center rounded-[28px] bg-[#0e73f6] text-[30px] font-bold text-white">
            {(mounted && name ? name : 'U').slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="text-[19px] font-bold text-slate-900">{mounted ? name : ''}</span>
      </div>

      {/* Что о мне записано */}
      <div className="px-1 pb-2.5 text-[15px] font-bold text-slate-900">{t('profile.personal')}</div>
      <MCard list>
        <Line label={t('profile.fullName')} value={mounted ? name : ''} />
        <Line label={t('profile.phone')} value={mounted ? formatPhoneNumber(user.phone || '') : ''} />
        <Line label="Email" value={user.email} />
      </MCard>

      {/* Что назначает администратор */}
      <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{t('profile.workspace')}</div>
      <MCard list>
        <Line label={t('profile.role')} value={user.role_name || user.role} />
        <Line label={t('profile.branch')} value={authStore.selectBranch?.name} />
      </MCard>
      <p className="px-2 pt-2 text-[11px] leading-relaxed text-slate-400">{t('profile.workspaceHint')}</p>

      {/* Безопасность */}
      <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{t('profile.securityGroup')}</div>
      <MCard list>
        <MRow
          icon={Phone}
          title={t('profile.changePhone')}
          subtitle={t('profile.changePhoneHint')}
          chevron
          onClick={() => router.push('/m/profile/account/phone')}
        />
        <MRow
          icon={KeyRound}
          title={tp('password.change')}
          chevron
          onClick={() => router.push('/m/profile/account/password')}
        />
      </MCard>
    </div>
  )
})

export default MobileAccountPage

'use client'

import { MCard, MScreenHeader } from '@/components/mobile/ui'
import { MSelectField, MSwitch } from '@/components/mobile/fields'
import { useRouter } from '@/hooks/useAppRouter'
import { useGeneralSettings } from '@/modules/settings/general/hooks/useGeneralSettings'
import useMounted from '@/hooks/useMounted'
import { Loader2 } from '@/components/mobile/icons'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'

/**
 * Настройки приложения: то, что влияет на весь учёт.
 *
 * Здесь только общие настройки — валюта по умолчанию, тип платежа и
 * дата начисления. Пользователи, роли, филиалы и договоры остаются на
 * компьютере: их настраивают один раз и не с телефона.
 */
const MobileSettingsPage = observer(() => {
  const t = useTranslations('Settings.general')
  const tc = useTranslations('Common')
  const tm = useTranslations('Mobile')
  const router = useRouter()
  const mounted = useMounted()

  const {
    isPayment,
    setIsPayment,
    isAccrualDate,
    setIsAccrualDate,
    currencyId,
    setCurrencyId,
    currenciesList,
    hasChanges,
    handleSaveSettings,
    isSaving,
  } = useGeneralSettings()

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader title={tm('profile.appSettings')} onBack={() => router.push('/m/profile')} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {/* Валюта, в которой считается учёт */}
        <div className="px-1 pb-2.5 text-[15px] font-bold text-slate-900">{t('account.title')}</div>
        <div className="flex flex-col gap-2">
          <MSelectField
            label={t('account.currency')}
            placeholder={t('account.placeholder')}
            value={mounted ? currencyId : ''}
            onChange={setCurrencyId}
            options={currenciesList || []}
          />
        </div>
        
        {/* Как ведём операции */}
        <div className="px-1 pt-6 pb-2.5 text-[15px] font-bold text-slate-900">{t('accounting.title')}</div>
        <MCard list>
          <MSwitch
            label={t('accounting.paymentType')}
            hint={tm('settings.paymentHint')}
            checked={Boolean(isPayment)}
            onChange={setIsPayment}
          />
          <MSwitch
            label={t('accounting.accrualDate')}
            hint={tm('settings.accrualHint')}
            checked={Boolean(isAccrualDate)}
            onChange={setIsAccrualDate}
          />
        </MCard>

        <p className="px-2 pt-6 text-[11px] leading-relaxed text-slate-400">{tm('settings.desktopOnly')}</p>
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={!hasChanges || isSaving}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#0e73f6] py-4 text-[16px] font-semibold text-white active:bg-[#0b5fd4] disabled:opacity-50"
        >
          {isSaving && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
          {tc('save')}
        </button>
      </div>
    </div>
  )
})

export default MobileSettingsPage

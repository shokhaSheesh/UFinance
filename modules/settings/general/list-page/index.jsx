'use client'

import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import SettingsHeader from '@/modules/settings/general/components/SettingsHeader'
import CurrencySetting from '@/modules/settings/general/components/CurrencySetting'
import PaymentSetting from '@/modules/settings/general/components/PaymentSetting'
import AccrualDateSetting from '@/modules/settings/general/components/AccrualDateSetting'
import { useGeneralSettings } from '@/modules/settings/general/hooks/useGeneralSettings'

const GeneralSettingsPage = observer(() => {
  const tg = useTranslations('Settings.general')
  const {
    isPayment,
    setIsPayment,
    isAccrualDate,
    setIsAccrualDate,
    currencyId,
    setCurrencyId,
    currenciesList,
    hasChanges,
    isSaving,
    handleSaveSettings,
  } = useGeneralSettings()

  return (
    <div className=" bg-white w-full">
      <SettingsHeader
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSave={handleSaveSettings}
      >
        <CurrencySetting
          currenciesList={currenciesList}
          currencyId={currencyId}
          setCurrencyId={setCurrencyId}
        />

        <section className="flex p-3 flex-col gap-1.5 mb-7 pb-6 border-b border-gray-200 items-start">
          <section className="flex flex-col gap-1.5 items-start">
            <h2 className="text-[15px] font-bold text-slate-900 mb-3.5">
              {tg('accounting.operations')}
            </h2>
            <PaymentSetting isPayment={isPayment} setIsPayment={setIsPayment} />
            <AccrualDateSetting
              isAccrualDate={isAccrualDate}
              setIsAccrualDate={setIsAccrualDate}
            />
          </section>
        </section>
      </SettingsHeader>
    </div>
  )
})

export default GeneralSettingsPage

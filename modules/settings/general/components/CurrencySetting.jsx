'use client'

import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { useTranslations } from 'next-intl'

const CurrencySetting = ({ currenciesList, currencyId, setCurrencyId }) => {
  const tg = useTranslations('Settings.general')

  return (
    <section className="flex p-3 flex-col gap-1.5 mb-7 pb-6 border-b border-gray-200 items-start">
      <h2 className="text-[15px] font-bold text-slate-900 mb-3.5">{tg('account.title')}</h2>
      <div className="mb-2">
        <label className="block text-sm font-medium text-slate-500 mb-1.5">
          {tg('account.currency')}
        </label>
        <div className="relative w-[280px]">
          <SingleSelect
            data={currenciesList}
            value={currencyId}
            onChange={setCurrencyId}
            placeholder={tg('account.placeholder')}
            isClearable={false}
            className="bg-white text-neutral-700"
          />
        </div>
      </div>
    </section>
  )
}

export default CurrencySetting

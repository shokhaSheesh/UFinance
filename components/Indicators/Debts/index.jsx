'use client'

import SelectLegelEntitties from '@/components/ReadyComponents/SelectLegelEntitties'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { indicators } from '@/store/indicatos.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import DebtChart from './DebtChart'
import SettingsPopover from './SettingsPopover'

// Поле с подписью сверху — как в шапке отчёта «Долги»
const Field = ({ label, className = '', children }) => (
  <div className={className}>
    <span className="block text-sm font-semibold text-neutral-500 mb-1">{label}</span>
    {children}
  </div>
)

/** Блок «Долги»: дебиторка и кредиторка с поставщиками */
const Debts = observer(() => {
  const t = useTranslations('Indicators')
  const { debtsSort, debtsLegalEntities, setState } = indicators

  const sortOptions = [
    { value: 'total', label: t('debts.sort.total') },
    { value: 'expired', label: t('debts.sort.expired') },
  ]

  return (
    <div className="w-full bg-white p-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold text-slate-900 py-1">{t('debts.title')}</h2>

        <div className="flex items-end gap-3 flex-wrap">
          <Field label={t('debts.filters.legalEntity')} className="w-[200px]">
            <SelectLegelEntitties
              multi
              value={debtsLegalEntities}
              onChange={(value) => setState('debtsLegalEntities', value)}
              placeholder={t('debts.filters.legalEntityPlaceholder')}
              className="bg-neutral-50/50"
            />
          </Field>

          <Field label={t('debts.sort.label')} className="w-[190px]">
            <SingleSelect
              data={sortOptions}
              // в сторе мог остаться режим из прошлой версии — показываем «Общая»
              value={debtsSort === 'expired' ? 'expired' : 'total'}
              onChange={(value) => setState('debtsSort', value || 'total')}
              withSearch={false}
              isClearable={false}
              className="bg-neutral-50/50"
            />
          </Field>

          <SettingsPopover />
        </div>
      </div>

      {/* Дебиторка и кредиторка рядом — на широком экране блок вдвое короче */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DebtChart type="debitorka" />
        <DebtChart type="kreditorka" />
      </div>
    </div>
  )
})

export default Debts

'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { indicators } from '@/store/indicatos.store'
import { Settings } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'

const ROUNDING_OPTIONS = ['3', '6', '9']

// Радиокнопка настроек — своя, чтобы не тянуть форм-библиотеку ради двух пунктов
const Radio = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2.5 cursor-pointer py-1.5 select-none">
    <span
      className={`flex items-center justify-center size-[18px] rounded-full border-2 transition-colors ${
        checked ? 'border-primary' : 'border-neutral-300'
      }`}
    >
      {checked && <span className="size-2.5 rounded-full bg-primary" />}
    </span>
    <input type="radio" className="sr-only" checked={checked} onChange={onChange} />
    <span className="text-[15px] font-medium text-neutral-800">{label}</span>
  </label>
)

/** Кнопка «Настроить»: подписи сумм на графиках и разрядность */
const SettingsPopover = observer(() => {
  const t = useTranslations('Indicators')
  const { debtsShowValues, debtsRounding, setState } = indicators

  const isCustomRounding = debtsRounding !== 'none'
  const roundingOptions = ROUNDING_OPTIONS.map((value) => ({ value, label: value }))

  return (
    <Popover>
      <PopoverTrigger className="flex items-center gap-2 h-10 px-4 rounded-md border border-neutral-200 bg-white text-[15px] font-semibold text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer whitespace-nowrap">
        <Settings size={18} className="text-neutral-500" />
        {t('debts.settings.button')}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[300px] p-4 bg-white gap-0">
        <h4 className="text-base font-bold text-neutral-900 mb-2">
          {t('debts.settings.display')}
        </h4>
        <OperationCheckbox
          checked={debtsShowValues}
          onChange={(e) => setState('debtsShowValues', e.target.checked)}
          label={t('debts.settings.showValues')}
        />

        <h4 className="text-base font-bold text-neutral-900 mt-4 mb-1">
          {t('debts.settings.rounding')}
        </h4>
        <Radio
          checked={!isCustomRounding}
          onChange={() => setState('debtsRounding', 'none')}
          label={t('debts.settings.noRounding')}
        />
        <Radio
          checked={isCustomRounding}
          // включаем округление со значением по умолчанию — 3 знака (тысячи)
          onChange={() => setState('debtsRounding', '3')}
          label={t('debts.settings.customRounding')}
        />

        {isCustomRounding && (
          <div className="flex items-center gap-3 mt-3">
            <span className="text-[15px] font-medium text-neutral-800">
              {t('debts.settings.roundTo')}
            </span>
            <div className="w-[76px]">
              <SingleSelect
                data={roundingOptions}
                value={debtsRounding}
                onChange={(value) => setState('debtsRounding', value || '3')}
                withSearch={false}
                isClearable={false}
                className="bg-white"
              />
            </div>
            <span className="text-[15px] font-medium text-neutral-800">
              {t('debts.settings.digits')}
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
})

export default SettingsPopover

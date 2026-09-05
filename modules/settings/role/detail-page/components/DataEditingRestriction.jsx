'use client'

import FormDatepicker from '@/components/shared/DatePicker/form-datepicker'
import HintQuestion from '@/components/shared/HintQuestion'
import Input from '@/components/shared/Input'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import CustomTooltip from '@/components/shared/Tooltip'
import { cn } from '@/lib/utils'
import { RESTRICTION_TYPES } from '@/utils/dataEditingRestriction'
import { CalendarRange } from 'lucide-react'
import moment from 'moment'

/**
 * «Ограничить изменение внесенных данных» — закрытый период роли.
 * Значение уходит в update_role_permissions рядом с role_permissions,
 * а на входе в систему приезжает в get_user_role_permissions и попадает
 * в appStore.dataEditingRestriction (см. utils/dataEditingRestriction.js).
 */
const DataEditingRestriction = ({ value, onChange, error, t }) => {
  const isUntilDate = value?.type === RESTRICTION_TYPES.UNTIL_DATE

  const typeOptions = [
    { value: RESTRICTION_TYPES.UNTIL_DATE, label: t('restriction.typeUntilDate') },
    { value: RESTRICTION_TYPES.BY_DAYS, label: t('restriction.typeByDays') },
  ]

  const patch = (fields) => onChange({ ...value, ...fields })

  // Штатный render у FormDatepicker всегда гонит значение через moment,
  // поэтому пустая дата рисуется как «Invalid date» вместо плейсхолдера
  const renderDateInput = (date, openCalendar) => (
    <button
      type="button"
      onClick={openCalendar}
      className={cn(
        'border bg-gray-ucode-25 rounded-md cursor-pointer px-1.5 py-1 h-[36px] w-full gap-2 flex items-center',
        error ? 'border-red-ucode' : 'border-gray-ucode-200',
      )}
    >
      <CalendarRange className="text-neutral-400" size={20} strokeWidth={1} />
      <span className={cn('text-sm', date ? 'text-slate-900' : 'text-gray-400')}>
        {date ? moment(String(date)).format('YYYY-MM-DD') : t('restriction.datePlaceholder')}
      </span>
    </button>
  )

  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="flex items-center gap-2">
        <OperationCheckbox
          checked={!!value?.isRestricted}
          onChange={() => patch({ isRestricted: !value?.isRestricted })}
          label={t('restriction.title')}
        />
        <CustomTooltip content={t('restriction.hint')} side="right">
          <span className="flex items-center cursor-help">
            <HintQuestion size={15} />
          </span>
        </CustomTooltip>
      </div>

      {value?.isRestricted && (
        <div className="flex flex-col gap-2 pl-7">
          <div className="flex items-start gap-3">
            <div className="w-[260px]">
              <SingleSelect
                data={typeOptions}
                value={value?.type}
                onChange={(type) =>
                  patch({ type: type || RESTRICTION_TYPES.BY_DAYS })
                }
                withSearch={false}
                isClearable={false}
                placeholder={t('restriction.typePlaceholder')}
              />
            </div>

            <div className="w-[260px]">
              {isUntilDate ? (
                <FormDatepicker
                  value={value?.untilDate || ''}
                  onChange={(date) =>
                    patch({
                      untilDate: date ? moment(date).format('YYYY-MM-DD') : '',
                    })
                  }
                  format="YYYY-MM-DD"
                  render={renderDateInput}
                />
              ) : (
                <Input
                  type="text"
                  inputMode="numeric"
                  value={value?.daysCount || ''}
                  placeholder={t('restriction.daysPlaceholder')}
                  onChange={(e) =>
                    patch({
                      daysCount: Number(e.target.value.replace(/\D/g, '')) || 0,
                    })
                  }
                />
              )}
            </div>
          </div>

          {error && <span className="text-xs text-red-ucode">{error}</span>}

          <span className="text-xs text-neutral-400 max-w-[560px]">
            {isUntilDate
              ? t('restriction.descriptionUntilDate')
              : t('restriction.descriptionByDays')}
          </span>
        </div>
      )}
    </div>
  )
}

export default DataEditingRestriction

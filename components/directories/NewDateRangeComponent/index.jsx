'use client'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CalendarRange } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import moment from 'moment/moment'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { CgClose } from 'react-icons/cg'
import { formatDate } from '../../../utils/formatDate'
import CustomCalendar from '../../shared/Calendar'
import { getPresetRange } from '../../../utils/datePresets'

const PRESET_GROUPS = {
  day: [
    { key: 'yesterday', tKey: 'yesterday' },
    { key: 'today', tKey: 'today' },
  ],
  week: [
    { key: 'prev_week', tKey: 'prevWeek' },
    { key: 'week', tKey: 'week' },
  ],
  month: [
    { key: 'prev_month', tKey: 'prevMonth' },
    { key: 'month', tKey: 'month' },
  ],
  quarter: [
    { key: 'prev_quarter', tKey: 'prevQuarter' },
    { key: 'quarter', tKey: 'quarter' },
  ],
  year: [
    { key: 'prev_year', tKey: 'prevYear' },
    { key: 'year', tKey: 'year' },
  ],
}

export default observer(function NewDateRangeComponent({ value, onChange, singleDateMode = false, clearable = true, defaultValue = { start: null, end: null }, onSetPresent, present = '', onClear, placeholder }) {
  const t = useTranslations('NewDateRangeComponent')
  const [startDate, setStartDate] = useState(value?.start)
  const [endDate, setEndDate] = useState(value?.end)
  const [activePreset, setActivePreset] = useState(present)
  const [dateType, setDateType] = useState()

  const wrapperRef = useRef(null)
  const [open, setOpen] = useState(false)

  // Sync internal state with external value changes (e.g., when clearing filters)
  useEffect(() => {
    setStartDate(value?.start || null)
    setEndDate(value?.end || null)
    setActivePreset(present)
  }, [value?.start, value?.end, present])

  const handlePreset = (key) => {
    const [s, e] = getPresetRange(key)
    setStartDate(s)
    setEndDate(e)
    setActivePreset(key)
  }

  const handleReset = () => {
    setStartDate(defaultValue?.start)
    setEndDate(defaultValue?.end)
    setDateType(null)
    setActivePreset(null)
    onChange?.({ start: defaultValue?.start, end: defaultValue?.end })
    setOpen(false)
    onClear?.()
  }

  const handleApply = () => {
    if (singleDateMode) {
      onChange?.({ start: startDate, end: startDate })
      onSetPresent?.(activePreset)
    } else {
      onChange?.({ start: startDate, end: endDate })
      onSetPresent?.(activePreset)
    }
    setOpen(false)
  }

  const handleDateType = (type) => {
    setDateType(type)
  }


  return (
    <div className="flex flex-col gap-3 w-full relative" ref={wrapperRef}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger>
          <div className="flex items-center gap-2 font-normal p-1.5 border border-neutrak-300 rounded-md bg-gray-ucode-25 relative cursor-pointer">
            <CalendarRange strokeWidth={1} className='text-neutral-400' />
            <input
              type="text"
              value={singleDateMode
                ? (startDate ? moment(startDate).format('DD.MM.YYYY') : (placeholder ?? t('selectDate')))
                : `${startDate ? moment(startDate).format('DD.MM.YYYY') + ' ~' : t('specifyPrefix')} ${endDate ? moment(endDate).format('DD.MM.YYYY') : t('periodWord')}`
              }
              className="border-none outline-none bg-transparent text-gray-ucode-400 text-xs font-normal w-full"
              placeholder={placeholder ?? (singleDateMode ? t('selectDate') : t('selectPeriod'))}
              readOnly
            />
            {(startDate || endDate) && clearable && <CgClose onClick={(e) => { e.stopPropagation(); handleReset(); }} className="cursor-pointer absolute right-3 text-gray-400 hover:text-gray-600" />}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-[340px] p-3 overflow-visible! border-none! bg-white  rounded-lg">
          <div className="flex flex-col gap-1">
            {Object.entries(PRESET_GROUPS).map(([groupKey, items]) => (
              <div key={groupKey} className="flex gap-2 w-full">
                {items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`flex-1 py-1.5  text-xs font-normal rounded cursor-pointer transition-all text-gray-700 bg-gray-100 hover:bg-gray-200 ${activePreset === item.key ? 'bg-primary! text-white!' : ''
                      }`}
                    onClick={() => handlePreset(item.key)}
                  >
                    {t(`presets.${item.tKey}`)}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Date pickers row */}
          <div className="flex items-center gap-2 my-2 border-t border-gray-100 pt-2">
            <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-md bg-gray-50/50 w-full">
              <CalendarRange strokeWidth={1} className='text-neutral-400' />
              <input
                type="text"
                value={startDate ? formatDate(startDate) : (singleDateMode ? t('selectDate') : t('start'))}
                onClick={() => handleDateType('startDate')}
                readOnly
                className="border-none outline-none bg-transparent text-gray-600 text-[11px] w-full"
              />
            </div>
            {!singleDateMode && (
              <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-md bg-gray-50/50 w-full">
                <CalendarRange strokeWidth={1} className='text-neutral-400' />
                <input
                  type="text"
                  value={endDate ? formatDate(endDate) : t('end')}
                  onClick={() => handleDateType('endDate')}
                  readOnly
                  className="border-none outline-none bg-transparent text-gray-600 text-[11px] w-full"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-2">
            <button
              type="button"
              className="secondary-btn"
              onClick={handleReset}
            >
              {t('reset')}
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={handleApply}
            >
              {t('apply')}
            </button>
          </div>

          {/* Calendar popup inside popover or side dropdown */}
          <div className="absolute top-0 left-full ml-1 z-50 bg-white border border-gray-200 rounded-lg shadow-md" style={{ display: dateType ? 'block' : 'none' }}>
            {dateType === 'startDate' && (
              <CustomCalendar
                maxDate={endDate}
                format="DD MMM, YYYY"
                value={startDate}
                onChange={(value) => {
                  setStartDate(value)
                  setDateType('endDate')
                }}
              />
            )}
            {dateType === 'endDate' && (
              <CustomCalendar
                minDate={startDate}
                format="DD MMM, YYYY"
                value={endDate}
                onChange={(value) => {
                  setEndDate(value)
                  setDateType('')
                }}
              />
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})

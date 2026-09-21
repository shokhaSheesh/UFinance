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
        {/* Поле выглядит как обычное поле ввода: белое, с рамкой, с датами
            «с — по». Раньше это был серый блок с бледным текстом, и его
            принимали за отключённый. */}
        <DropdownMenuTrigger className="w-full text-left">
          <div className="relative flex h-9 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm transition-colors hover:border-slate-300 cursor-pointer">
            <CalendarRange size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
            {singleDateMode ? (
              <span className={startDate ? 'text-slate-900' : 'text-slate-400'}>
                {startDate ? moment(startDate).format('DD.MM.YYYY') : (placeholder ?? t('selectDate'))}
              </span>
            ) : startDate || endDate ? (
              <span className="flex min-w-0 items-center gap-1.5 text-slate-900 tabular-nums">
                <span>{startDate ? moment(startDate).format('DD.MM.YYYY') : '…'}</span>
                <span className="text-slate-400">—</span>
                <span>{endDate ? moment(endDate).format('DD.MM.YYYY') : '…'}</span>
              </span>
            ) : (
              <span className="text-slate-400">{placeholder ?? t('selectPeriod')}</span>
            )}
            {(startDate || endDate) && clearable && (
              <CgClose
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                className="absolute right-3 cursor-pointer text-slate-400 hover:text-slate-600"
              />
            )}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-[340px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          {/* Готовые периоды */}
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(PRESET_GROUPS).flat().map((item) => (
              <button
                key={item.key}
                type="button"
                className={`h-8 rounded-md text-xs font-medium cursor-pointer transition-colors ${activePreset === item.key
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                onClick={() => handlePreset(item.key)}
              >
                {t(`presets.${item.tKey}`)}
              </button>
            ))}
          </div>

          {/* Свой диапазон: «С» и «По» */}
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => handleDateType('startDate')}
              className={`flex flex-col items-start gap-0.5 rounded-lg border px-2.5 py-1.5 text-left cursor-pointer transition-colors ${dateType === 'startDate' ? 'border-primary bg-[#eef4ff]' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{t('from')}</span>
              <span className={`text-sm tabular-nums ${startDate ? 'text-slate-900' : 'text-slate-400'}`}>
                {startDate ? formatDate(startDate) : (singleDateMode ? t('selectDate') : t('start'))}
              </span>
            </button>
            {!singleDateMode && (
              <button
                type="button"
                onClick={() => handleDateType('endDate')}
                className={`flex flex-col items-start gap-0.5 rounded-lg border px-2.5 py-1.5 text-left cursor-pointer transition-colors ${dateType === 'endDate' ? 'border-primary bg-[#eef4ff]' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{t('to')}</span>
                <span className={`text-sm tabular-nums ${endDate ? 'text-slate-900' : 'text-slate-400'}`}>
                  {endDate ? formatDate(endDate) : t('end')}
                </span>
              </button>
            )}
          </div>

          {/* Календарь — под полями «С»/«По», внутри окна выбора. Раньше он
              открывался справа от него и в окне по центру экрана уходил за край. */}
          {dateType === 'startDate' && (
            <div className="mt-2 flex justify-center">
              <CustomCalendar
                maxDate={endDate}
                format="DD MMM, YYYY"
                value={startDate}
                onChange={(value) => {
                  setStartDate(value)
                  setDateType(singleDateMode ? '' : 'endDate')
                }}
              />
            </div>
          )}
          {dateType === 'endDate' && (
            <div className="mt-2 flex justify-center">
              <CustomCalendar
                minDate={startDate}
                format="DD MMM, YYYY"
                value={endDate}
                onChange={(value) => {
                  setEndDate(value)
                  setDateType('')
                }}
              />
            </div>
          )}

          <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" className="secondary-btn" onClick={handleReset}>
              {t('reset')}
            </button>
            <button type="button" className="primary-btn" onClick={handleApply}>
              {t('apply')}
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})

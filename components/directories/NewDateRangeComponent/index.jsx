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

  // Календарь открыт всегда, поэтому «активное» поле есть всегда: если
  // пользователь ничего не выбирал — это «С»
  const activeField = singleDateMode ? 'startDate' : (dateType || 'startDate')

  // Клик по дню: заполняет активное поле и переводит выбор на «По».
  // Ручной выбор дат снимает подсветку готового периода.
  const handleDayPick = (value) => {
    setActivePreset(null)
    if (singleDateMode || activeField === 'startDate') {
      setStartDate(value)
      // конец раньше нового начала — сбрасываем, чтобы диапазон не вывернулся
      if (endDate && value && new Date(value) > new Date(endDate)) setEndDate(null)
      if (!singleDateMode) setDateType('endDate')
    } else {
      setEndDate(value)
      setDateType('startDate')
    }
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

        {/* Две панели: слева готовые периоды, справа календарь — открыт сразу.
            Раньше всё шло одной колонкой (периоды, поля, календарь), окно
            выходило высоким и в окне фильтров вылезало за верх экрана. */}
        <DropdownMenuContent
          align="start"
          className={`${singleDateMode ? 'w-[340px]' : 'w-[600px]'} max-w-[94vw] rounded-xl border border-slate-200 bg-white p-0 shadow-lg`}
        >
          <div className="flex">
            {!singleDateMode && (
              <div className="flex w-[176px] shrink-0 flex-col gap-0.5 border-r border-slate-100 p-2">
                {Object.values(PRESET_GROUPS).flat().map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handlePreset(item.key)}
                    className={`h-8 rounded-md px-2.5 text-left text-sm cursor-pointer transition-colors ${activePreset === item.key
                      ? 'bg-[#eef4ff] font-medium text-primary'
                      : 'text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    {t(`presets.${item.tKey}`)}
                  </button>
                ))}
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col p-3">
              {/* «С» и «По»: какое поле выделено, в то и попадёт следующий клик в календаре */}
              <div className={`grid gap-2 ${singleDateMode ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <button
                  type="button"
                  onClick={() => handleDateType('startDate')}
                  className={`flex flex-col items-start gap-0.5 rounded-lg border px-2.5 py-1.5 text-left cursor-pointer transition-colors ${activeField === 'startDate' ? 'border-primary bg-[#eef4ff]' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{singleDateMode ? t('selectDate') : t('from')}</span>
                  <span className={`text-sm tabular-nums ${startDate ? 'text-slate-900' : 'text-slate-400'}`}>
                    {startDate ? formatDate(startDate) : t('start')}
                  </span>
                </button>
                {!singleDateMode && (
                  <button
                    type="button"
                    onClick={() => handleDateType('endDate')}
                    className={`flex flex-col items-start gap-0.5 rounded-lg border px-2.5 py-1.5 text-left cursor-pointer transition-colors ${activeField === 'endDate' ? 'border-primary bg-[#eef4ff]' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{t('to')}</span>
                    <span className={`text-sm tabular-nums ${endDate ? 'text-slate-900' : 'text-slate-400'}`}>
                      {endDate ? formatDate(endDate) : t('end')}
                    </span>
                  </button>
                )}
              </div>

              <div className="mt-2 flex justify-center">
                <CustomCalendar
                  format="DD MMM, YYYY"
                  value={activeField === 'endDate' ? (endDate || startDate) : startDate}
                  minDate={activeField === 'endDate' ? startDate : undefined}
                  onChange={handleDayPick}
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" className="secondary-btn" onClick={handleReset}>
                  {t('reset')}
                </button>
                <button type="button" className="primary-btn" onClick={handleApply}>
                  {t('apply')}
                </button>
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})

'use client'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CalendarRange } from 'lucide-react'
import moment from 'moment/moment'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { CgClose } from 'react-icons/cg'
import { formatDate } from '../../../utils/formatDate'
import CustomCalendar from '../../shared/Calendar'

const getPresetRange = (key) => {

  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()
  const dow = (today.getDay() + 6) % 7 // Mon=0

  switch (key) {
    case 'today':
      return [today, today]
    case 'yesterday': {
      const yd = new Date(y, m, d - 1)
      return [yd, yd]
    }
    case 'prev_week': {
      const start = new Date(y, m, d - dow - 7)
      const end = new Date(y, m, d - dow - 1)
      return [start, end]
    }
    case 'week': {
      const start = new Date(y, m, d - dow)
      return [start, today]
    }
    case 'prev_month': {
      const start = new Date(y, m - 1, 1)
      const end = new Date(y, m, 0)
      return [start, end]
    }
    case 'month':
      return [new Date(y, m, 1), today]
    case 'prev_quarter': {
      // Seasonal: Winter(11,0,1), Spring(2,3,4), Summer(5,6,7), Autumn(8,9,10)
      let qStartMonth;
      let qYear = y;
      if (m === 11 || m === 0 || m === 1) { // Winter
        qStartMonth = 11;
        if (m < 2) qYear -= 1;
      } else if (m >= 2 && m <= 4) qStartMonth = 2; // Spring
      else if (m >= 5 && m <= 7) qStartMonth = 5; // Summer
      else qStartMonth = 8; // Autumn

      const start = new Date(qYear, qStartMonth - 3, 1)
      const end = new Date(qYear, qStartMonth, 0)
      return [start, end]
    }
    case 'quarter': {
      let qStartMonth;
      let qYear = y;
      if (m === 11 || m === 0 || m === 1) { // Winter
        qStartMonth = 11;
        if (m < 2) qYear -= 1;
      } else if (m >= 2 && m <= 4) qStartMonth = 2; // Spring
      else if (m >= 5 && m <= 7) qStartMonth = 5; // Summer
      else qStartMonth = 8; // Autumn

      const start = new Date(qYear, qStartMonth, 1)
      const end = new Date(qYear, qStartMonth + 3, 0)
      return [start, end]
    }
    case 'prev_year': {
      const start = new Date(y - 1, 0, 1)
      const end = new Date(y - 1, 11, 31)
      return [start, end]
    }
    case 'year':
      return [new Date(y, 0, 1), new Date(y, 11, 31)]
    default:
      return [null, null]
  }
}

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

export default function NewDateRangeComponent({ value, onChange, singleDateMode = false, clearable = true, defaultValue = { start: null, end: null } }) {
  const t = useTranslations('NewDateRangeComponent')
  const [startDate, setStartDate] = useState(value?.start)
  const [endDate, setEndDate] = useState(value?.end)
  const [activePreset, setActivePreset] = useState(value?.start ? null : 'year')
  const [dateType, setDateType] = useState()

  const wrapperRef = useRef(null)
  const [open, setOpen] = useState(false)



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
  }

  const handleApply = () => {
    if (singleDateMode) {
      onChange?.({ start: startDate, end: startDate })
    } else {
      onChange?.({ start: startDate, end: endDate })
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
                ? (startDate ? moment(startDate).format('DD.MM.YYYY') : t('selectDate'))
                : `${startDate ? moment(startDate).format('DD.MM.YYYY') + ' ~' : t('specifyPrefix')} ${endDate ? moment(endDate).format('DD.MM.YYYY') : t('periodWord')}`
              }
              className="border-none outline-none bg-transparent text-gray-ucode-400 text-xs font-normal w-full"
              placeholder={singleDateMode ? t('selectDate') : t('selectPeriod')}
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
}

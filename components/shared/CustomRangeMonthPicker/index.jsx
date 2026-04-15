'use client'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CalendarRange } from 'lucide-react'
import moment from 'moment'
import { useRef, useState } from 'react'
import { CgClose } from 'react-icons/cg'
import CustomCalendar from '../Calendar'

const getPresetRange = (key) => {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth() // 0-11

  switch (key) {
    case 'this_month':
      return [new Date(y, m, 1), new Date(y, m, 1)]
    case 'last_month': {
      const lastM = m === 0 ? 11 : m - 1
      const lastY = m === 0 ? y - 1 : y
      return [new Date(lastY, lastM, 1), new Date(lastY, lastM, 1)]
    }
    case 'this_quarter': {
      const q = Math.floor(m / 3)
      return [new Date(y, q * 3, 1), new Date(y, q * 3 + 2, 1)]
    }
    case 'last_quarter': {
      const q = Math.floor(m / 3)
      let lastQ = q - 1
      let lastQY = y
      if (lastQ < 0) {
        lastQ = 3
        lastQY = y - 1
      }
      return [new Date(lastQY, lastQ * 3, 1), new Date(lastQY, lastQ * 3 + 2, 1)]
    }
    case 'this_year':
      return [new Date(y, 0, 1), new Date(y, 11, 1)]
    case 'last_year':
      return [new Date(y - 1, 0, 1), new Date(y - 1, 11, 1)]
    case 'last_3_months':
      return [new Date(y, m - 2, 1), new Date(y, m, 1)]
    case 'last_6_months':
      return [new Date(y, m - 5, 1), new Date(y, m, 1)]
    default:
      return [null, null]
  }
}

const PRESETS = {
  quick: [
    { key: 'this_month', label: 'Этот месяц' },
    { key: 'last_month', label: 'Прошлый месяц' },
  ],
  quarter: [
    { key: 'this_quarter', label: 'Этот квартал' },
    { key: 'last_quarter', label: 'Прошлый квартал' },
  ],
  year: [
    { key: 'this_year', label: 'Этот год' },
    { key: 'last_year', label: 'Прошлый год' },
  ],
  range: [
    { key: 'last_3_months', label: 'Последние 3 мес' },
    { key: 'last_6_months', label: 'Последние 6 мес' },
  ]
}

const formatMonth = (date) => {
  if (!date) return ''
  return moment(date).format('MM.YYYY')
}

const CustomRangeMonthPicker = ({ value, onChange, clearable = true }) => {
  const [rangeMonth, setRangeMonth] = useState(value || null)

  const wrapperRef = useRef(null)
  const [open, setOpen] = useState(false)


  const handleReset = () => {
    setRangeMonth(null)
    onChange?.({ start: null, end: null })
    setOpen(false)
  }


  const displayValue = () => {
    if (!rangeMonth) return 'Выберите период'
    const start = rangeMonth[0] ? formatMonth(rangeMonth[0]) : ''
    const end = rangeMonth[1] ? formatMonth(rangeMonth[1]) : ''
    if (start === end) return start
    return `${start} - ${end}`
  }

  return (
    <div className="flex flex-col gap-3 w-full relative" ref={wrapperRef}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger>
          <div className="flex items-center gap-2 font-normal p-1.5 border border-neutral-300 rounded-md bg-gray-ucode-25 relative cursor-pointer">
            <CalendarRange strokeWidth={1} className='text-neutral-400' />
            <input
              type="text"
              value={displayValue()}
              className="border-none outline-none bg-transparent text-gray-ucode-400 text-xs font-normal w-full"
              placeholder="Выберите период"
              readOnly
            />
            {rangeMonth && clearable && (
              <CgClose
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                className="cursor-pointer absolute right-3 text-gray-400 hover:text-gray-600"
              />
            )}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-fit overflow-visible! bg-white border-none! ">
          <CustomCalendar
            type="month"
            format="MMMM YYYY"
            value={rangeMonth}
            onChange={(value) => {
              console.log('CustomCalendar', value)
              setRangeMonth(value)
            }}
            range
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default CustomRangeMonthPicker
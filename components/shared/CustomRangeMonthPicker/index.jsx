'use client'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CalendarRange } from 'lucide-react'
import moment from 'moment'
import { useRef, useState } from 'react'
import { CgClose } from 'react-icons/cg'
import CustomCalendar from '../Calendar'



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
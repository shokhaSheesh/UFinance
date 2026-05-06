'use client'
import { CalendarRange } from 'lucide-react'
import { toJS } from 'mobx'
import moment from 'moment'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import DatePicker from 'react-multi-date-picker'
import { defaultRangeMonth } from '../../../store/student.store'


const CustomRangeMonthPicker = ({ value, onChange: onSelect, inputClass, handleSubmit, numberOfMonths = 1, ...props }) => {
  const formatedValues = toJS(value)
  const router = useRouter()
  const ref = useRef()
  const [rangeMonth, setRangeMonth] = useState([new Date(formatedValues?.start), new Date(formatedValues?.end)])

  const handleReset = () => {
    onSelect?.(defaultRangeMonth)
    setRangeMonth([new Date(defaultRangeMonth?.start), new Date(defaultRangeMonth?.end)])
    router.refresh()
    handleSubmit?.()
    ref.current.closeCalendar()
  }

  const handleApply = () => {
    ref.current.closeCalendar()
    if (Array.isArray(rangeMonth)) {
      const [start, end] = rangeMonth

      const startDate = start
        ? new Date(start.year, start.monthIndex, 1)           // Oyning 1-kuni
        : null

      const endDate = end
        ? new Date(end.year, end.monthIndex + 1, 0)           // Oyning oxirgi kuni (0 = oldingi oyning so'nggisi)
        : null

      onSelect?.({ start: moment(startDate).format('YYYY-MM-DD'), end: moment(endDate).format('YYYY-MM-DD') })

    } else if (rangeMonth) {
      // Bitta oy tanlanganda
      const startDate = new Date(rangeMonth.year, rangeMonth.monthIndex, 1)
      const endDate = new Date(rangeMonth.year, rangeMonth.monthIndex + 1, 0)

      onSelect?.({ start: moment(startDate).format('YYYY-MM-DD'), end: moment(endDate).format('YYYY-MM-DD') })
    }

    handleSubmit?.()
  }


  return <DatePicker
    onlyMonthPicker
    ref={ref}
    className={`custom_month_picker rounded-md! mt-4! max-${numberOfMonths * 300}`}
    shadow={false}
    arrow={true}
    format='MMM, YYYY'
    value={rangeMonth}
    numberOfMonths={numberOfMonths}
    onChange={(month) => setRangeMonth(month)}
    renderButton={(direction, handleClick) => (
      <button className='border p-2 h-7  w-7 rounded-sm! cursor-pointer text-lg flex items-center justify-center' onClick={handleClick}>
        {direction === "right" ? "»" : "«"}
      </button>
    )}
    containerClassName='w-full'
    render={(value, openCalendar) => {
      return (
        <button className={`border bg-gray-ucode-25 w-full! rounded-md cursor-pointer border-gray-ucode-200 px-1.5 py-1 h-[36px] gap-2 flex items-center ${inputClass}`} onClick={openCalendar}>
          <CalendarRange className='text-neutral-400' size={20} strokeWidth={1} /> <span className='pt-1 text-sm'>{value || 'Выберите период'}</span>
        </button>
      )
    }}
    portal
    {...props}
  >
    <div className='flex items-center justify-end p-2 gap-2'>
      <button onClick={handleReset} className='secondary-btn'>Отмена</button>
      <button className='primary-btn' onClick={handleApply}>Применить</button>
    </div>
  </DatePicker>
}

export default CustomRangeMonthPicker
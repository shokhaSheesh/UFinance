'use client'
import { CalendarRange } from 'lucide-react'
import { toJS } from 'mobx'
import moment from 'moment'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import DatePicker from 'react-multi-date-picker'
import { defaultRangeMonth } from '../../../store/student.store'


const CustomRangeMonthPicker = ({ value, onChange: onSelect, inputClass, handleSubmit, numberOfMonths = 1, ...props }) => {
  const formatedValues = toJS(value)
  const router = useRouter()
  const [rangeMonth, setRangeMonth] = useState([new Date(formatedValues.start), new Date(formatedValues.end)])

  const handleReset = () => { 
    onSelect?.(defaultRangeMonth)
    router.refresh()
    handleSubmit?.()
  }

  const handleApply = () => {
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
// <div className="flex flex-col gap-3 w-full relative" ref={wrapperRef}>
//   <DropdownMenu open={open} onOpenChange={setOpen}>
//     <DropdownMenuTrigger>
//       <div className="flex items-center gap-2 font-normal p-1.5 border border-neutral-300 rounded-md bg-gray-ucode-25 relative cursor-pointer">
//         <CalendarRange strokeWidth={1} className='text-neutral-400' />
//         <input
//           type="text"
//           value={displayValue()}
//           className="border-none outline-none bg-transparent text-gray-ucode-400 text-xs font-normal w-full"
//           placeholder="Выберите период"
//           readOnly
//         />
//         {rangeMonth && clearable && (
//           <CgClose
//             onClick={(e) => { e.stopPropagation(); handleReset(); }}
//             className="cursor-pointer absolute right-3 text-gray-400 hover:text-gray-600"
//           />
//         )}
//       </div>
//     </DropdownMenuTrigger>

//     <DropdownMenuContent className="w-fit overflow-visible! bg-white border-none! ">
//       <CustomCalendar
//         type="month"
//         format="MMMM YYYY"
//         value={rangeMonth}
//         onChange={(value) => {
//           console.log('CustomCalendar', value)
//           setRangeMonth(value)
//         }}
//         range
//       />
//       <div className='flex items-center gap-2 justify-end p-2'><button onClick={handleReset} className="secondary-btn">Сбросить</button>
//         <button onClick={handleApply} className="primary-btn">Применить</button></div>
//     </DropdownMenuContent>
//   </DropdownMenu>
// </div>

export default CustomRangeMonthPicker
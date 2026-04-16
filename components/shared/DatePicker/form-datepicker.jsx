import { CalendarRange } from 'lucide-react'
import moment from 'moment'
import DatePicker from 'react-multi-date-picker'
import './form-datepicker.scss'
const FormDatepicker = ({ inputClass, format, ...props }) => {
  return <DatePicker
    {...props}
    portal
    render={(value, openCalendar) => {
      return (
        <button className={`border bg-gray-ucode-25 rounded-md cursor-pointer border-gray-ucode-200 px-1.5 py-1 h-[36px] w-full gap-2 flex items-center ${inputClass}`} onClick={openCalendar}>
          <CalendarRange className='text-neutral-400' size={20} strokeWidth={1} /> <span className='pt-1 text-sm'>{moment(value).format(format || 'DD.MM.YYYY') || 'Выберите дату'}</span>
        </button>
      )
    }}
  />
}

export default FormDatepicker
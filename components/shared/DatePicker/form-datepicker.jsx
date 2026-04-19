import { CalendarRange } from 'lucide-react'
import moment from 'moment'
import DatePicker from 'react-multi-date-picker'
import './form-datepicker.scss'
const FormDatepicker = ({ inputClass, className, value, onChange, format = "DD MMM, YYYY", type = null, ...props }) => {
  return <DatePicker
    portal
    value={value}
    format={format}
    onChange={(dataObj) => {
      if (Array.isArray(dataObj)) {
        onChange(dataObj.map(d => d.toDate?.() || d))
      } else if (dataObj?.toDate) {
        onChange(dataObj.toDate())
      } else {
        onChange(dataObj)
      }
    }}
    shadow={false}
    arrow={false}
    containerClassName='date_picker_container'
    className={`form_date_picker_corner ${className}`}
    renderButton={(direction, handleClick) => (
      <button className='border p-2 h-7  w-7 rounded-sm! text-lg flex items-center justify-center' onClick={handleClick}>
        {direction === "right" ? "»" : "«"}
      </button>
    )}
    render={(value, openCalendar) => {
      return (
        <button className={`border bg-gray-ucode-25 rounded-md cursor-pointer border-gray-ucode-200 px-1.5 py-1 h-[36px] w-full gap-2 flex items-center ${inputClass}`} onClick={openCalendar}>
          <CalendarRange className='text-neutral-400' size={20} strokeWidth={1} /> <span className='pt-1 text-sm'>{moment(value).format(format || 'DD.MM.YYYY') || 'Выберите дату'}</span>
        </button>
      )
    }}
    {...(type === 'month' ? { onlyMonthPicker: true } : {})}
    {...props}
  />
}

export default FormDatepicker
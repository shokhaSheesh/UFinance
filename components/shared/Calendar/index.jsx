import { Calendar } from "react-multi-date-picker"
import './calendar.scss'

export default function CustomCalendar({ value, onChange, format = "DD MMM, YYYY", type = null, ...props }) {
  return (
    <div className="calendar_wrapper">
      <Calendar
        value={value || new Date()}
        onChange={(dataObj) => {
          if (Array.isArray(dataObj)) {
            // Range mode: convert array of DateObjects to array of native Dates
            onChange(dataObj.map(d => d.toDate?.() || d))
          } else if (dataObj?.toDate) {
            // Single DateObject: convert to native Date
            onChange(dataObj.toDate())
          } else {
            onChange(dataObj)
          }
        }}
        format={format}
        {...(type === 'month' ? { onlyMonthPicker: true } : {})}
        {...props}
      />
    </div>
  )
}
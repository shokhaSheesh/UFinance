import { cn } from "@/app/lib/utils";
import { CalendarRange } from "lucide-react";
import DatePicker from "react-multi-date-picker";
import './style.scss';

export default function CustomDatePicker({ value, onChange, format = "DD MMM, YYYY", type = null, className, ...props }) {

  return (
    <div className={cn("date_picker_wrapper w-full", className)}>
      <DatePicker
        value={value || new Date()}
        format={format}
        {...(type === 'month' ? { onlyMonthPicker: true } : {})}
        onChange={(dataObj => onChange(dataObj.format(format)))}
        {...props}
        inputMode="none"
      />
      <CalendarRange
        className="date-picker-icon" strokeWidth={1.2} />
    </div>
  );
}
import { cn } from "@/lib/utils";
import { CalendarRange } from "lucide-react";
import { useMemo } from "react";
import DatePicker from "react-multi-date-picker";
import './style.scss';

export default function CustomDatePicker({ value, onChange, format = "DD MMM, YYYY", type = null, className, ...props }) {

  // Qiymat bo'lmaganda fallback barqaror bo'lsin: har renderda `new Date()` yaratilsa,
  // react-multi-date-picker uni "yangi qiymat" deb bilib, oy navigatsiyasini (« ») bosgan
  // zahoti ko'rinishni bugungi oyga qaytaradi.
  const fallbackDate = useMemo(() => new Date(), []);

  return (
    <div className={cn("date_picker_wrapper w-full", className)}>
      <DatePicker
        portal
        className="ufinance_datepicker"
        value={value || fallbackDate}
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
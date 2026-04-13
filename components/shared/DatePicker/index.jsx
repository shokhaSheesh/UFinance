import { cn } from "@/app/lib/utils";
import { Calendar } from "lucide-react";
import DatePicker from "react-multi-date-picker";
import './style.scss';

export default function CustomDatePicker({ value, onChange, format = "DD MMM, YYYY", className, ...props }) {

  return (
    <div className={cn("date_picker_wrapper w-full", className)}>
      <DatePicker
        value={value || new Date()}
        format={format}
        onChange={(dataObj => onChange(dataObj.format(format)))}
        {...props}
      />
      <Calendar className="date-picker-icon" />
    </div>
  );
}
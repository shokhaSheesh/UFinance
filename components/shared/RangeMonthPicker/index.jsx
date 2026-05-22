"use client"
import { cn } from "@/lib/utils";
import { useState } from "react";
import DatePicker from "react-multi-date-picker";
import DatePanel from "react-multi-date-picker/plugins/date_panel";

import { CalendarRange } from "lucide-react";
import './month-picker.scss';

const RangeMonthPicker = ({ value, onChange, format = "MMMM, YYYY", className, ...props }) => {
  const [state, setState] = useState([
    { year: new Date().getFullYear(), month: 1 },
    { year: new Date().getFullYear(), month: new Date().getMonth() },
  ]);
  return (
    <div className={cn("month_picker_wrapper gap-1", className)}>
      <CalendarRange className="date-picker-icon text-gray-ucode-500" strokeWidth={1.4} />
      <DatePicker
        onlyMonthPicker
        range
        format={format}
        value={value || state}
        onChange={onChange || setState}
        plugins={[<DatePanel key="date-panel" />]}
        {...props}
      />
    </div>
  )
}

export default RangeMonthPicker
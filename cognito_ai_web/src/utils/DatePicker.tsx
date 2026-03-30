import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs, { type Dayjs } from "dayjs";
import { Calendar } from "lucide-react";

const parseDateString = (str: string): Date => {
  const [mm, dd, yyyy] = str.split("-").map(Number);
  return new Date(yyyy, mm - 1, dd);
};

const formatDateString = (date: Date): string => dayjs(date).format("MM-DD-YYYY");

const daysInMonth = (month: number, year: number): number => new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (date: Date): number =>
    dayjs(new Date(date.getFullYear(), date.getMonth(), 1)).day();

type DatePickerProps = {
  value?: any;
  onChange: (value: string) => void;
};

export default function DatePicker({
                                     value,
                                     onChange,
                                     displayFormat = "MM/DD/YYYY",
                                   }: {
  value?: any;
  onChange: (value: string) => void;
  displayFormat?: string; // e.g. "MM/DD/YYYY" or "MM-DD-YYYY"
}) {
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const initialDate = value ? parseDateString(value) : new Date();
  const [viewDate, setViewDate] = useState<Date>(initialDate);
  const calendarRef = useRef<HTMLDivElement | null>(null);
// ---- Build a display string using the displayFormat prop ----
  const raw = (typeof value === "string" ? value : "").trim();
  const hyphenVal = raw.replace(/\s+/g, "-").replace(/\//g, "-"); // accept "MM DD YYYY" or "MM/DD/YYYY"
  let displayValue = "";

  if (/^\d{2}-\d{2}-\d{4}$/.test(hyphenVal)) {
    const [mm, dd, yyyy] = hyphenVal.split("-").map(Number);
    const jsDate = new Date(yyyy, mm - 1, dd);
    if (!isNaN(jsDate.getTime())) {
      displayValue = dayjs(jsDate).format(displayFormat); // <- UI format only
    }
  }

  const selected: Dayjs | null = value ? dayjs(parseDateString(value)) : null;
  const current: Dayjs = dayjs(viewDate);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (date: Dayjs): void => {
    onChange(formatDateString(date.toDate()));
    setShowCalendar(false);
  };

  const renderDay = (date: Dayjs, isOutside: boolean = false): React.ReactNode => {
    const isSelected = selected?.isSame(date, "day");
    return (
        <button
            key={date.format("YYYY-MM-DD")}
            onClick={() => handleSelect(date)}
            className={`w-9 h-9 cursor-pointer flex items-center justify-center rounded-md text-sm transition-all
          ${isSelected ? "bg-sky-600 text-white" : ""}
          ${isOutside ? "text-gray-400" : "text-gray-900 hover:bg-blue-100"}`}
        >
          {date.date()}
        </button>
    );
  };

  const renderDays = (): React.ReactNode => {
    const firstDay = getFirstDayOfMonth(viewDate);
    const daysInCurrent = daysInMonth(current.month(), current.year());
    const daysInPrev = daysInMonth(current.month() - 1, current.year());

    const days: React.ReactNode[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrev - i;
      const date = dayjs(current).subtract(1, "month").date(day);
      days.push(renderDay(date, true));
    }

    for (let d = 1; d <= daysInCurrent; d++) {
      const date = dayjs(current).date(d);
      days.push(renderDay(date));
    }

    const total = days.length;
    const remaining = 42 - total;
    for (let i = 1; i <= remaining; i++) {
      const date = dayjs(current).add(1, "month").date(i);
      days.push(renderDay(date, true));
    }

    return days;
  };

  const toggleMonth = (amount: number): void => {
    setViewDate(dayjs(viewDate).add(amount, "month").toDate());
  };

  const toggleYear = (amount: number): void => {
    setViewDate(dayjs(viewDate).add(amount, "year").toDate());
  };

  return (
      <div className="relative inline-block w-full" ref={calendarRef}>
        <div
            className="relative shadow text-[0.85rem] border border-gray-200 rounded-md bg-[#f8f8f8] w-full cursor-pointer hover:shadow-sm transition"
            onClick={() => setShowCalendar((prev: boolean) => !prev)}
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <div className="pl-9 pr-3 py-2 w-full">{displayValue || "Select a date"}</div>
        </div>
        <AnimatePresence>
          {showCalendar && (
              <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute select-none top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-10 w-72"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <button
                        onClick={() => toggleYear(-1)}
                        className="text-gray-500 cursor-pointer hover:text-black"
                    >
                      &laquo;
                    </button>
                    <button
                        onClick={() => toggleMonth(-1)}
                        className="text-gray-500 cursor-pointer hover:text-black"
                    >
                      &lt;
                    </button>
                  </div>
                  <div className="font-medium text-sm">{current.format("MMMM YYYY")}</div>
                  <div className="flex items-center space-x-2">
                    <button
                        onClick={() => toggleMonth(1)}
                        className="text-gray-500 cursor-pointer hover:text-black"
                    >
                      &gt;
                    </button>
                    <button
                        onClick={() => toggleYear(1)}
                        className="text-gray-500 cursor-pointer hover:text-black"
                    >
                      &raquo;
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d: string) => (
                      <div key={d}>{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}

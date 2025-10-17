import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "~/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  // 생년월일 선택을 위한 기본 연도 범위 설정 (1900년부터 현재까지)
  const currentYear = new Date().getFullYear()
  const fromYear = props.fromYear ?? 1900
  const toYear = props.toYear ?? currentYear

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout="dropdown-buttons"
      fromYear={fromYear}
      toYear={toYear}
      className={cn("p-3 bg-white rounded-lg border border-gray-200 shadow-sm", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center gap-3 mb-4",
        caption_label: "hidden",
        caption_dropdowns: "flex gap-3 items-center",
        dropdown_month: "flex-1 min-w-[100px]",
        dropdown_year: "flex-1 min-w-[100px]",
        dropdown: "h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium leading-tight shadow-sm transition-all hover:border-orange-300 hover:shadow-md focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-between",
        vhidden: "hidden",
        nav: "hidden",
        nav_button: "hidden",
        nav_button_previous: "hidden",
        nav_button_next: "hidden",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell:
          "text-gray-500 rounded-md w-10 font-semibold text-xs uppercase tracking-wide",
        row: "flex w-full mt-1",
        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-orange-50/50 first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg",
        day: cn(
          "h-10 w-10 p-0 font-normal inline-flex items-center justify-center rounded-lg text-sm transition-all hover:bg-orange-50 hover:text-orange-600 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-orange-500 text-white font-semibold shadow-md hover:bg-orange-600 hover:text-white hover:shadow-lg focus:bg-orange-600 focus:text-white",
        day_today: "bg-orange-50 text-orange-600 font-semibold border border-orange-200",
        day_outside:
          "day-outside text-gray-300 aria-selected:bg-orange-50/30 aria-selected:text-gray-300",
        day_disabled: "text-gray-300 line-through",
        day_range_middle:
          "aria-selected:bg-orange-50/50 aria-selected:text-orange-600",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
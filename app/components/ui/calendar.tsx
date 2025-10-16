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
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center gap-2",
        caption_label: "text-sm font-medium text-gray-900",
        caption_dropdowns: "flex gap-2",
        dropdown_month: "px-2 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50",
        dropdown_year: "px-2 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50",
        dropdown: "px-2 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50",
        nav: "hidden", // 드롭다운 모드에서는 네비게이션 버튼 숨김
        nav_button: "hidden",
        nav_button_previous: "hidden",
        nav_button_next: "hidden",
        table: "w-full border-collapse space-y-1 bg-white",
        head_row: "flex",
        head_cell:
          "text-gray-600 rounded-md w-9 font-normal text-[0.8rem] bg-white",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative bg-white [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-orange-50 [&:has([aria-selected])]:bg-orange-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 inline-flex items-center justify-center rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-gray-900 hover:bg-orange-50 hover:text-orange-700"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-orange-500 text-white hover:bg-orange-600 hover:text-white focus:bg-orange-600 focus:text-white",
        day_today: "bg-orange-100 text-orange-900 font-medium",
        day_outside:
          "day-outside text-gray-400 opacity-50 aria-selected:bg-orange-50 aria-selected:text-gray-400 aria-selected:opacity-30",
        day_disabled: "text-gray-400 opacity-50",
        day_range_middle:
          "aria-selected:bg-orange-50 aria-selected:text-orange-700",
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
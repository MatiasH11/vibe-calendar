"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { SelectRangeEventHandler, SelectSingleEventHandler } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  mode?: "single" | "multiple" | "range"
  selected?: Date | Date[] | { from: Date; to?: Date }
  onSelect?: SelectSingleEventHandler | SelectRangeEventHandler | ((dates: Date[] | undefined) => void)
  disabled?: (date: Date) => boolean
  placeholder?: string
  className?: string
}

export function DatePicker({
  mode = "single",
  selected,
  onSelect,
  disabled,
  placeholder = "Pick a date",
  className
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const formatSelectedDates = () => {
    if (!selected) return placeholder

    if (mode === "single" && selected instanceof Date) {
      return format(selected, "PPP")
    }

    if (mode === "multiple" && Array.isArray(selected)) {
      if (selected.length === 0) return placeholder
      if (selected.length === 1) return format(selected[0], "PPP")
      return `${selected.length} dates selected`
    }

    if (mode === "range" && selected && typeof selected === "object" && "from" in selected) {
      if (selected.from) {
        if (selected.to) {
          return `${format(selected.from, "LLL dd, y")} - ${format(selected.to, "LLL dd, y")}`
        }
        return format(selected.from, "LLL dd, y")
      }
    }

    return placeholder
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatSelectedDates()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode={mode as any}
          selected={selected as any}
          onSelect={onSelect as any}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
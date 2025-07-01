"use client"

import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function DatePicker({ value, onChange, placeholder, id }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  const [displayMonth, setDisplayMonth] = React.useState<Date>(selectedDate || new Date());

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"))
      setDisplayMonth(date);
    }
    setOpen(false)
  }

  React.useEffect(() => {
    if (open && selectedDate) {
      setDisplayMonth(selectedDate);
    } else if (open) {
      setDisplayMonth(new Date());
    }
  }, [open, selectedDate]);

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(false)}
        id={id}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "absolute right-0 top-0 h-full w-10 p-0 font-normal",
              !value && "text-muted-foreground"
            )}
            aria-label="Open calendar"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

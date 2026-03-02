"use client";

import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  small?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "tt.mm.jjjj",
  small,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const date = value ? new Date(value + "T00:00:00") : undefined;

  function handleSelect(day: Date | undefined) {
    if (day) {
      const y = day.getFullYear();
      const m = String(day.getMonth() + 1).padStart(2, "0");
      const d = String(day.getDate()).padStart(2, "0");
      onChange(`${y}-${m}-${d}`);
    } else {
      onChange("");
    }
    setOpen(false);
  }

  return (
    <div className={cn("flex gap-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "justify-start text-left font-normal flex-1",
              !value && "text-muted-foreground",
              small && "h-8 text-xs"
            )}
          >
            <CalendarIcon
              className={cn("mr-2 shrink-0", small ? "h-3 w-3" : "h-4 w-4")}
            />
            {date ? format(date, "dd.MM.yyyy", { locale: de }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            defaultMonth={date}
            locale={de}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          type="button"
          size={small ? "sm" : "icon"}
          variant="ghost"
          className={cn(small ? "h-8 px-2" : "h-9 w-9 shrink-0")}
          onClick={() => onChange("")}
          title="Datum entfernen"
        >
          <X className={cn(small ? "w-3 h-3" : "w-4 h-4")} />
        </Button>
      )}
    </div>
  );
}

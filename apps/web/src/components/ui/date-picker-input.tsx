import { useRef } from "react";
import { CalendarDays, X } from "lucide-react";

import { Input } from "@/components/ui/input";

interface DatePickerInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function formatDisplayDate(iso: string) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function DatePickerInput({ id, label, value, onChange }: DatePickerInputProps) {
  const pickerRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const picker = pickerRef.current;
    if (!picker) return;

    try {
      picker.showPicker();
    } catch {
      picker.click();
    }
  }

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode="none"
        value={formatDisplayDate(value)}
        placeholder="DD/MM/YYYY"
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        readOnly
        className="cursor-pointer pr-16 tabular-nums"
      />

      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={`Clear ${label.toLowerCase()}`}
          className="absolute right-8 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}

      <button
        type="button"
        onClick={openPicker}
        aria-label={`Choose ${label.toLowerCase()}`}
        className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <CalendarDays className="h-4 w-4" />
      </button>

      <input
        ref={pickerRef}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
      />
    </div>
  );
}

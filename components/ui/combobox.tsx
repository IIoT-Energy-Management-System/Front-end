"use client";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "@/lib/i18n";
import { formatInTimeZone } from "date-fns-tz";
import { Check, ChevronsUpDown } from "lucide-react";
import moment from "moment-timezone";
import { useMemo, useState } from "react";

interface TimezoneComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function TimezoneCombobox({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Chọn múi giờ...",
}: TimezoneComboboxProps) {
  const [open, setOpen] = useState(false);
    const { t } = useTranslation();

  const timezoneOptions = useMemo(() => {
    return moment.tz.names().map((tz) => ({
      value: tz,
      label: `${tz} (GMT${formatInTimeZone(new Date(), tz, "XXX")})`,
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
          aria-expanded={open}
          disabled={disabled}
        >
          {value
            ? timezoneOptions.find((tz) => tz.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={`${t("user.searchTimezone")}`} />
          <CommandList>
            <CommandEmpty>{t("user.noTimezoneFound")}</CommandEmpty>
            <CommandGroup >
              {timezoneOptions.map((tz) => (
                <CommandItem
                  key={tz.value}
                  value={tz.label}  // Filter dựa trên label
                  onSelect={() => {
                    onValueChange(tz.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === tz.value ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {tz.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

import * as React from "react"
import { Check, ChevronDown, Lock } from "lucide-react"

import { cn } from "../lib/utils"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"
import { FormFieldOption } from "../types/form"

interface SingleSelectComboboxProps {
  options: FormFieldOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  showIndicators?: boolean; // Show K/V indicators
  popoverWidth?: string; // Custom popover width (e.g., "400px", "max-w-md")
}

export function SingleSelectCombobox({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  disabled = false,
  showIndicators = false,
  popoverWidth,
}: SingleSelectComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const selectedOption = options.find((option) => String(option.value) === String(value))

  // Helper function to render option with indicators and description
  const renderOptionLabel = (option: FormFieldOption) => {
    const indicators = [];
    if (showIndicators) {
      if (option.isKey) indicators.push('K');
      if (option.isVerification) indicators.push('V');
    }

    return (
      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-medium">{option.label}</span>
          {option.description && (
            <span className="text-xs text-muted-foreground truncate">{option.description}</span>
          )}
        </div>
        {indicators.length > 0 && (
          <div className="flex gap-1 ml-2 flex-shrink-0">
            {indicators.map((indicator, index) => (
              <Badge 
                key={index}
                variant="outline" 
                className={cn(
                  "text-xs px-1 py-0 h-4 font-semibold",
                  indicator === 'K' && "bg-blue-100 text-blue-700 border-blue-300",
                  indicator === 'V' && "bg-green-100 text-green-700 border-green-300"
                )}
              >
                {indicator}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
      <Button
  variant="outline"
  role="combobox"
  aria-expanded={open}
  className={cn(
    "w-full justify-between h-7 text-xs px-2 overflow-hidden",
    disabled && "cursor-not-allowed"
  )}
  disabled={disabled}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
>
  <span className="truncate block max-w-[85%] text-xs">
    {selectedOption ? selectedOption.label : placeholder}
  </span>
  {disabled && isHovered ? (
    <Lock className="ml-1 h-3 w-3 shrink-0 text-gray-500" />
  ) : (
    <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
  )}
</Button>

      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "p-0",
          popoverWidth || "w-[--radix-popover-trigger-width] max-w-[500px]"
        )}
        style={{ zIndex: 99999 }}
        sideOffset={4}
        align="start"
        avoidCollisions={true}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={String(option.value)}
                  value={String(option.value)}
                  keywords={[option.label, option.description].filter(Boolean)}
                  onSelect={(selectedValue) => {
                    onChange(selectedValue === String(value) ? "" : selectedValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {renderOptionLabel(option)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

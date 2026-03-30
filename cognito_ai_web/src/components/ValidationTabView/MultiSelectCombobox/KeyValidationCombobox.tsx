"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "../lib/utils"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"
import { FormFieldOption1 } from "../types/form"
import Spinner from "../ui/spinner"

interface MultiSelectComboboxProps {
  options: FormFieldOption1[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  showAddButton?: boolean;
  onAddClick?: () => void;
  addButtonLabel?: string;
  showIndicators?: boolean; // New prop to show K/V indicators
  onlyAllowKeyFields?: boolean; // New prop to only allow selection of KeyField="Yes" options
}

export function KeyValidationCombobox({
  options,
  value = [],
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyText = "No options found.",
  isLoading = false,
  disabled = false,
  showAddButton = false,
  onAddClick,
  addButtonLabel = "Add new...",
  showIndicators = false,
  onlyAllowKeyFields = false
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (selectedValue: string | number) => {
    const isSelected = value && value?.map(String).includes(String(selectedValue));
    const newSelected = isSelected
      ? value.filter((v) => String(v) !== String(selectedValue))
      : [...value, selectedValue];
    onChange(newSelected);
  }

  // Filter options to only show KeyField="Yes" if onlyAllowKeyFields is true
  const filteredOptions = React.useMemo(() => {
    if (!onlyAllowKeyFields) return options;
    return options.filter((option) => option.isKey === true);
  }, [options, onlyAllowKeyFields]);

  const handleSelectAll = () => {
    if (value.length === filteredOptions.length) {
      onChange([])
    } else {
      onChange(filteredOptions.map((option) => option.value))
    }
  }

  const selectedOptions = filteredOptions.filter(o => value.map(String).includes(String(o.value)));

  // Helper function to render option with indicators
  const renderOptionLabel = (option: FormFieldOption1) => {
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between !h-9"
          disabled={disabled || isLoading}
        >
          <div className="flex gap-1 items-center truncate">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : selectedOptions.length === 1 ? (
              <span>{selectedOptions[0].label}</span>
            ) : (
              <>
                <span>{selectedOptions[0].label}</span>
                <Badge variant="secondary" className="font-normal">
                  +{selectedOptions.length - 1}
                </Badge>
              </>
            )}
          </div>
          <div className="flex items-center">
            {isLoading && <Spinner className="mr-2" />}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[999]">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            {isLoading ? (
               <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={handleSelectAll}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        value.length === filteredOptions.length && filteredOptions.length > 0
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    {value.length === filteredOptions.length ? "Deselect All" : "Select All"}
                  </CommandItem>
                  {filteredOptions?.length > 0 && filteredOptions.map((option) => {
                    const isSelected = value && value?.map(String).includes(String(option.value));
                    // Determine if this option is selectable (non-key fields are disabled when onlyAllowKeyFields is true)
                    const isSelectable = !onlyAllowKeyFields || option.isKey === true;

                    return (
                      <CommandItem
                        key={String(option.value)}
                        value={String(option.value)}
                        onSelect={() => isSelectable && handleSelect(option.value)}
                        className={cn(
                          "cursor-pointer",
                          !isSelectable && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={!isSelectable}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <Check className={cn("h-4 w-4")} />
                        </div>
                        {renderOptionLabel(option)}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                {showAddButton && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setOpen(false);
                          onAddClick?.();
                        }}
                        className="cursor-pointer"
                      >
                        <PlusCircle className="mr-2 h-4 w-4 text-blue-500" />
                        <span className="text-blue-500">{addButtonLabel}</span>
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
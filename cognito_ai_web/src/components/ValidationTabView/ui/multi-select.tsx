"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "../lib/utils"
import { Badge } from "./badge"
import { Button } from "./button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"
import { FormFieldOption } from "../types/form"
import Spinner from "./spinner"

interface MultiSelectComboboxProps {
  options: FormFieldOption[];
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
}

export function MultiSelectCombobox({
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
  addButtonLabel = "Add new..."
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (selectedValue: string | number) => {
    const isSelected = value && value?.map(String).includes(String(selectedValue));
    const newSelected = isSelected
      ? value.filter((v) => String(v) !== String(selectedValue))
      : [...value, selectedValue];
    onChange(newSelected);
  }

  const handleSelectAll = () => {
    if (value.length === options.length) {
      onChange([])
    } else {
      onChange(options.map((option) => option.value))
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full !justify-between h-auto"
          disabled={disabled || isLoading}
        >
          <div className="flex gap-1 flex-wrap">
            {value.length > 0 ? (
              value.map((val) => {
                const option = options.find((o) => String(o.value) === String(val));
                return option ? (
                  <Badge
                    key={String(val)}
                    variant="secondary"
                    className="mr-1"
                  >
                    {option.label}
                  </Badge>
                ) : null;
              })
            ) : (
              <span>{placeholder}</span>
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
                        value.length === options.length && options.length > 0
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    {value.length === options.length ? "Deselect All" : "Select All"}
                  </CommandItem>
                  {options?.length > 0 && options.map((option) => {
                    const isSelected = value && value?.map(String).includes(String(option.value));
                    return (
                      <CommandItem
                        key={String(option.value)}
                        value={String(option.value)}
                        onSelect={() => handleSelect(option.value)}
                        className="cursor-pointer"
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
                        {option.label}
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

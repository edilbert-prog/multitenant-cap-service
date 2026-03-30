// src/components/ui/comboboxV2.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import Spinner from "./spinner";

export type FormFieldOption = {
  value: string | number;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
};

interface ComboboxProps {
  options: FormFieldOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  showAddButton?: boolean;
  onAddClick?: () => void;
  addButtonLabel?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  isLoading = false,
  disabled = false,
  showAddButton = false,
  onAddClick,
  addButtonLabel = "Add new...",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-7 text-xs px-2 text-left"
          disabled={disabled || isLoading}
        >
          <div className="flex items-center truncate min-w-0 flex-1">
            {selectedOption?.icon && (
              <selectedOption.icon className="mr-2 h-3 w-3 text-gray-500 flex-shrink-0" />
            )}
            <span className="truncate text-xs">
              {selectedOption?.label || placeholder}
            </span>
          </div>
          <div className="flex items-center ml-2 flex-shrink-0">
            {isLoading && <Spinner className="mr-1 h-3 w-3" />}
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[999] border border-gray-200 shadow-lg">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-8 text-xs" />
          <CommandList>
            {isLoading ? (
              <div className="p-3 text-center text-xs text-gray-500">
                Loading...
              </div>
            ) : (
              <>
                <CommandEmpty className="text-xs p-3">{emptyText}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={String(option.value)}
                      value={option.label}
                      onSelect={() => {
                        const isDeselecting =
                          String(value) === String(option.value);
                        onChange(isDeselecting ? "" : option.value);
                        setOpen(false);
                      }}
                      className="text-xs py-1.5 px-2"
                    >
                      <div className="flex items-center w-full">
                        <Check
                          className={cn(
                            "mr-2 h-3 w-3 flex-shrink-0",
                            String(value) === String(option.value)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {option.icon && ( 
                          <option.icon className="mr-2 h-3 w-3 text-gray-500 flex-shrink-0" />
                        )}
                        <span className="truncate text-xs flex-1">
                          {option.label}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
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
                        className="cursor-pointer text-xs py-1.5 px-2"
                      >
                        <div className="flex items-center w-full">
                          <PlusCircle className="mr-2 h-3 w-3 text-[#0071E9] flex-shrink-0" />
                          <span className="text-[#0071E9] text-xs">{addButtonLabel}</span>
                        </div>
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
  );
}
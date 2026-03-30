"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Check, ChevronsUpDown, PlusCircle, Search, X } from "lucide-react"
import { cn } from "../lib/utils"
import { FormFieldOption } from "../types/form"

interface AlternativeSelectProps {
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
    className?: string;
}

export function AlternativeSelect({
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
  className
}: AlternativeSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const optionsRef = useRef<HTMLDivElement[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Filter options based on search term
  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()))

  // Calculate dropdown position based on available space
  useEffect(() => {
    if (open && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - buttonRect.bottom
      const spaceAbove = buttonRect.top
      const dropdownHeight = 300 // Approximate dropdown height

      // Show dropdown above if there's more space above or not enough below
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('top')
      } else {
        setDropdownPosition('bottom')
      }
    }
  }, [open])

  // Reset search and highlighted index when opening/closing
  useEffect(() => {
    if (open) {
      setSearchTerm("")
      setHighlightedIndex(-1)
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 0)
    }
  }, [open])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          onChange(filteredOptions[highlightedIndex].value)
          setOpen(false)
        }
        break
      case "Escape":
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      })
    }
  }, [highlightedIndex])

  const clearSearch = () => {
    setSearchTerm("")
    searchInputRef.current?.focus()
  }

  return (
    <div className="relative w-full" onKeyDown={handleKeyDown}>
      <Button
        ref={buttonRef}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn("!justify-between bg-transparent w-full", className)}
        onClick={() => setOpen(!open)}
        disabled={disabled}
      >
        <span className="truncate max-w-[calc(100%-24px)]">
          {value ? options.find((option) => option.value === value)?.label || placeholder : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0" />
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className={cn(
            "absolute left-0 z-[9999] w-full rounded-md border border-gray-200 bg-white text-gray-900 shadow-md",
            dropdownPosition === 'top' ? "bottom-full mb-1" : "top-full mt-1"
          )}>
            {/* Search Input */}
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                ref={searchInputRef}
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setHighlightedIndex(-1) // Reset highlight when searching
                }}
                className="h-8 border-0 p-0 outline-none placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                autoComplete="off"
              />
              {searchTerm && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-transparent" onClick={clearSearch}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Options List */}
            <div className="max-h-[250px] overflow-y-auto">
              <div className="p-1 space-y-1">
                {filteredOptions.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">No results found.</div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <div
                      key={option.value}
                      ref={(el) => {
                        if (el) optionsRef.current[index] = el
                      }}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                        "hover:bg-gray-100 hover:text-gray-900",
                        value === option.value && "bg-gray-100 text-gray-900",
                        highlightedIndex === index && "bg-gray-50",
                      )}
                      onClick={() => {
                        onChange(option.value)
                        setOpen(false)
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                      <span className="flex-1">{option.label}</span>
                    </div>
                  ))
                )}
                {showAddButton && (
                  <div
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                      highlightedIndex === filteredOptions.length && "bg-[#0071E9]/10",
                    )}
                    onClick={() => {
                      onAddClick?.()
                      setOpen(false)
                    }}
                    onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span className="flex-1">{addButtonLabel}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Results count */}
            {searchTerm && (
              <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
                {filteredOptions.length} of {options.length} options
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

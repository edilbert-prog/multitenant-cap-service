import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";

export type Option = {
  value: string;
  label: string;
};

type DropdownSize = "small" | "medium";
type DropdownMode = "single" | "multiple";

export type DropdownRef = {
  getSelected: () => string;
};

export type DropdownProps = {
  Disabled?: boolean;
  options?: any;
  mode?: DropdownMode;
  placeholder?: string;
  value?: string | string[];
  onChange?: (...args: any[]) => void;
  onSearch?: (term: string) => void;
  searchable?: boolean;
  size?: DropdownSize;
  children?: React.ReactNode;
};

const toArray = (val?: string | string[]): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    return val
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
  }
  return [];
};

const toCsv = (val?: string | string[]): string => {
  if (Array.isArray(val)) return val.join(",");
  return val ?? "";
};

const Dropdown = forwardRef<DropdownRef, DropdownProps>(
    (
        {
          Disabled = false,
          options = [],
          mode = "single",
          value = "",
          onChange,
          onSearch,
          searchable = true,
          size = "medium",
        },
        ref
    ) => {
      const [open, setOpen] = useState<boolean>(false);
      const [search, setSearch] = useState<string>("");
      const [dropUp, setDropUp] = useState<boolean>(false);
      const dropdownRef = useRef<HTMLDivElement | null>(null);
      const dropdownListRef = useRef<HTMLDivElement | null>(null);
      const userTypedRef = useRef<boolean>(false);

      const isSmall = size === "small";
      const optList: Option[] = Array.isArray(options) ? (options as Option[]) : [];

      const toggleOpen = (): void => setOpen((prev: boolean) => !prev);

      const stringToObjects = (val: string | string[]): Option[] => {
        const values = toArray(val);
        return optList.filter((opt) => values.includes(opt.value));
      };

      const currentSelection: Option | Option[] | null =
          mode === "single"
              ? optList.find((opt) => opt.value === toCsv(value)) || null
              : stringToObjects(value);

      const handleSelect = (option: Option): void => {
        if (mode === "single") {
          const selected = optList.find((opt) => opt.value === option.value);
          if (selected) {
            onChange?.(selected.value, selected);
            setOpen(false);
          }
        } else {
          const selectedValues = toArray(value);
          const exists = selectedValues.includes(option.value);
          const newValues = exists
              ? selectedValues.filter((v) => v !== option.value)
              : [...selectedValues, option.value];
          const newValueString = newValues.join(",");
          const selectedOptions = optList.filter((opt) =>
              newValues.includes(opt.value)
          );
          onChange?.(newValueString, selectedOptions, option);
          if (exists) setSearch("");
        }
      };

      const isSelected = (option: Option): boolean => {
        if (mode === "single") return toCsv(value) === option.value;
        return toArray(value).includes(option.value);
      };

      const filteredOptions: Option[] = searchable
          ? optList.filter((opt) =>
              opt.label.toLowerCase().includes(search.toLowerCase())
          )
          : [...optList];

      useEffect(() => {
        const handler = (e: MouseEvent): void => {
          if (!dropdownRef.current?.contains(e.target as Node)) {
            setOpen(false);
          }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
      }, []);

      useEffect(() => {
        if (searchable && userTypedRef.current) {
          onSearch?.(search);
          userTypedRef.current = false;
        }
      }, [search, searchable, onSearch]);

      useEffect(() => {
        if (!open) setSearch("");
      }, [open]);

      useEffect(() => {
        if (open && dropdownRef.current) {
          const rect = dropdownRef.current.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          const estimatedHeight = 250;
          setDropUp(spaceBelow < estimatedHeight && spaceAbove > estimatedHeight);
        }
      }, [open]);

      useImperativeHandle(ref, (): DropdownRef => ({
        getSelected: () => toCsv(value),
      }));

      const sizeStyles = {
        container: isSmall ? "px-2 py-1 text-sm" : "px-4 py-1.5 text-base",
        searchInput: isSmall ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
        chip: isSmall
            ? "text-[0.70rem] px-2 py-[0.1rem]"
            : "text-[0.80rem] px-3 py-[0.15rem]",
        dropdownItem: isSmall ? "text-xs px-3 py-1.5" : "text-sm px-4 py-2",
      } as const;

      return (
          <div ref={dropdownRef} className="relative w-full">
            <div
                className={`border border-gray-300 rounded-md shadow-xs cursor-pointer flex flex-wrap gap-2 items-center transition ${
                    Disabled ? "bg-[#ebebeb] pointer-events-none" : "bg-[#f8f8f8] hover:shadow-md"
                } ${sizeStyles.container}`}
                onClick={Disabled ? undefined : toggleOpen}
            >
              {mode === "multiple" ? (
                  <motion.div layout className="flex flex-wrap gap-1.5 flex-1">
                    <AnimatePresence initial={false}>
                      {(currentSelection as Option[]).length ? (
                          (currentSelection as Option[]).map((item) => (
                              <motion.div
                                  key={item.value}
                                  layout
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className={`flex items-center gap-1 rounded-full bg-[#007f00] text-white ${sizeStyles.chip}`}
                                  onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                                    e.stopPropagation();
                                    handleSelect(item);
                                  }}
                              >
                                {item.label}
                                <X
                                    className={`ml-1 cursor-pointer ${isSmall ? "w-3 h-3" : "w-4 h-4"}`}
                                    onClick={(e: React.MouseEvent<SVGSVGElement>) => {
                                      e.stopPropagation();
                                      handleSelect(item);
                                    }}
                                />
                              </motion.div>
                          ))
                      ) : (
                          <motion.span
                              key="placeholder"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-gray-500 text-sm"
                          >
                            Select
                          </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
              ) : (
                  <div className="flex items-center justify-between flex-1">
                    <div className={`truncate ${Disabled ? "text-[#6f6f6f]" : ""}`}>
                      {(currentSelection as Option | null)?.label || (
                          <span className="text-gray-400 text-sm">Select</span>
                      )}
                    </div>
                    {(currentSelection as Option | null) && !Disabled && (
                        <X
                            className={`text-gray-400 ml-2 cursor-pointer hover:text-gray-600 ${
                                isSmall ? "w-3 h-3" : "w-4 h-4"
                            }`}
                            onClick={(e: React.MouseEvent<SVGSVGElement>) => {
                              e.stopPropagation();
                              onChange?.("", null);
                            }}
                        />
                    )}
                  </div>
              )}
              <ChevronDown className={`text-gray-700 ml-2 ${isSmall ? "w-3 h-3" : "w-4 h-4"}`} />
            </div>

            <AnimatePresence>
              {open && (
                  <motion.div
                      ref={dropdownListRef}
                      initial={{ opacity: 0, y: dropUp ? 8 : -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: dropUp ? 8 : -8 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute z-[9999] min-w={180} w-full bg-white rounded-lg border border-[#c2c2c2] shadow-xl overflow-hidden mt-2 ${
                          dropUp ? "bottom-full mb-2" : ""
                      }`}
                  >
                    {searchable && (
                        <div className="p-2 border-b">
                          <div className="relative">
                            <input
                                className={`w-full border border-gray-300 bg-[#f8f8f8] rounded-full focus:outline-none pr-8 ${sizeStyles.searchInput}`}
                                placeholder="Search..."
                                value={search}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  userTypedRef.current = true;
                                  setSearch(e.target.value);
                                }}
                            />
                            {search && (
                                <X
                                    className={`absolute right-2 top-2.5 text-gray-400 cursor-pointer ${
                                        isSmall ? "w-3 h-3" : "w-4 h-4"
                                    }`}
                                    onClick={(_e: React.MouseEvent<SVGSVGElement>) => setSearch("")}
                                />
                            )}
                          </div>
                        </div>
                    )}

                    <div className="max-h-60 overflow-auto">
                      {filteredOptions.length > 0 ? (
                          filteredOptions.map((opt) => (
                              <div
                                  key={opt.value}
                                  className={`flex justify-between items-center border-b border-gray-200 cursor-pointer transition ${
                                      isSelected(opt)
                                          ? "bg-[#377d2124] text-[#377d21] font-semibold hover:bg-[#377d2124]"
                                          : "hover:bg-gray-100"
                                  } ${sizeStyles.dropdownItem}`}
                                  onClick={(): void => handleSelect(opt)}
                              >
                                {opt.label}
                                {mode === "multiple" && isSelected(opt) && (
                                    <X
                                        className={`${isSmall ? "w-3 h-3" : "w-4 h-4"} ${
                                            isSelected(opt) ? "text-gray-900" : "text-gray-400"
                                        }`}
                                    />
                                )}
                              </div>
                          ))
                      ) : (
                          <div className="px-4 py-2 text-sm text-gray-400">No options</div>
                      )}
                    </div>
                  </motion.div>
              )}
            </AnimatePresence>
          </div>
      );
    }
);

export default Dropdown;

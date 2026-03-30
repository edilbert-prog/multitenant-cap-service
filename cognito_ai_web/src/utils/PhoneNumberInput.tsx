import React, { useEffect, useRef, useState } from "react";
import Dropdown from "./Dropdown";
import maxDigitsByCountryJson from "./CountryCode.json";

type Option = {
  label: string;
  value: string;
  [key: string]: unknown;
};

type Props = {
  countryOptions?: Option[];
  countryCode?: string;
  phoneNumber?: string;
  onCountryChange?: (newCode: string, option?: Option) => void;
onPhoneChange?: (digits: string, formatted: string) => void;
disabled?: boolean;
};

const maxDigitsByCountry = maxDigitsByCountryJson as Record<string, number>;

const formatNumber = (digits: string, isoCode: string): string => {
  if (isoCode === "IN") {
    return digits.replace(/(\d{5})(\d{0,5})/, (_, p1: string, p2: string) => `${p1} ${p2}`.trim());
  } else if (isoCode === "US") {
    return digits.replace(
        /(\d{0,3})(\d{0,3})(\d{0,4})/,
        (_: string, p1: string, p2: string, p3: string) =>
            `${p1 ? `(${p1})` : ""}${p2 ? ` ${p2}` : ""}${p3 ? `-${p3}` : ""}`.trim()
    );
  }
  return digits;
};

const extractIsoFromLabel = (label: string = ""): string => {
  const match = label.match(/^([A-Z]{2})\s?\(/);
  return match?.[1] || "US";
};

const getDigits = (value: string): string => value.replace(/\D/g, "");

export default function PhoneNumberInput(props: Props) {
  const {
    countryOptions = [],
    countryCode = "91",
    phoneNumber = "",
    onCountryChange,
    onPhoneChange,
    disabled = false,
  } = props;

  const selectedOption: Option | undefined =
      countryOptions.find((c) => c.value === countryCode) || countryOptions[0];
  const isoCode: string = extractIsoFromLabel(selectedOption?.label as string);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [displayValue, setDisplayValue] = useState<string>(
      formatNumber(getDigits(phoneNumber), isoCode)
  );

  useEffect(() => {
    setDisplayValue(formatNumber(getDigits(phoneNumber), isoCode));
  }, [phoneNumber, isoCode]);

  const getNextCursorPosition = (raw: string, formatted: string, oldPos: number): number => {
    const rawDigitsBeforeCursor = getDigits(raw.slice(0, oldPos));
    const digitCount = rawDigitsBeforeCursor.length;

    let count = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i] ?? "")) count++;
      if (count === digitCount) return i + 1;
    }
    return formatted.length;
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const input = e.target;
    const raw = input.value;
    const cursor = input.selectionStart ?? raw.length;

    let digits = getDigits(raw);

    const maxDigits = maxDigitsByCountry[isoCode] ?? maxDigitsByCountry["default"];
    if (typeof maxDigits === "number" && digits.length > maxDigits) {
      digits = digits.slice(0, maxDigits);
    }

    const formatted = formatNumber(digits, isoCode);

    setDisplayValue(formatted);
    onPhoneChange?.(digits, formatted);
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const newCursor = getNextCursorPosition(raw, formatted, cursor);
        inputRef.current.setSelectionRange(newCursor, newCursor);
      }
    });
  };

  const handleCountryChange = (newCode: string, _option?: Option): void => {
    onCountryChange?.(newCode, _option);
  };

  return (
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center border border-gray-200 rounded-md bg-[#f8f8f8] relative overflow-visible">
          <div className="w-36 border-r border-r-gray-200 z-10 flex-shrink-0">
            <Dropdown
                Disabled={disabled}
                mode="single"
                options={countryOptions}
                value={countryCode}
                onChange={handleCountryChange}
                onSearch={(q: string) => console.log("Search (Multi):", q)}
            />
          </div>
          <input
              disabled={disabled}
              readOnly={disabled}
              ref={inputRef}
              type="tel"
              className={`flex-1 px-3 shadow text-[0.85rem] py-2  ${
                  disabled ? "text-[#6f6f6f] bg-[#ebebeb]" : "border bg-[#f8f8f8] border-gray-200"
              } rounded-tr-md rounded-br-md  focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter phone number"
              value={displayValue}
              onChange={handleNumberChange}
          />
        </div>
      </div>
  );
}

import React, { ChangeEvent, KeyboardEvent } from "react";
import { CircleAlert } from "lucide-react";

interface ConfigurableInputProps {
  value: string | number;
  /**
   * Callback function that is fired when the input value changes.
   */
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  /**
   * Determines if the component should render inputType a standard input or a textarea.
   * @default 'input'
   */
  inputType?: "input" | "textarea";
  /**
   * Specifies the type of data the input should handle.
   * If 'number', only numeric characters will be allowed.
   * @default 'text'
   */
  dataType?: "text" | "number" | "alphanumeric";
  /**
   * If set to `false`, special characters will be stripped from the input.
   * @default true
   */
  allowSpecialChars?: boolean;
  /**
   * A regular expression to validate the input against.
   * This is only applied if `allowSpecialChars` is `true`.
   * The regex should define the complete set of **allowed** characters.
   * For example, to allow only alphanumeric characters and hyphens: /^[a-zA-Z0-9-]*$/
   */
  allowedCharsRegex?: RegExp;
  /**
   * The maximum number of characters allowed in the input.
   */
  maxLength?: number;
  /**
   * An error message to display below the input.
   */
  error?: string;
  /**
   * Standard input placeholder attribute.
   */
  placeholder?: string;
  /**
   * Standard input name attribute.
   */
  name?: string;
  /**
   * Standard input id attribute.
   */
  id?: string;
  /**
   * Additional CSS classes to apply to the input/textarea element.
   */
  className?: string;
  /**
   * The number of visible text lines for a textarea. Only applies when inputType is 'textarea'.
   */
  rows?: number;
  /**
   * Any other props to pass down to the input or textarea element.
   */
  [key: string]: any; // Allow other standard props like rows, cols, etc.
}

const CustomInput: React.FC<ConfigurableInputProps> = ({
  value,
  onChange,
  inputType = "input",
  dataType = "text",
  allowSpecialChars = true,
  allowedCharsRegex,
  maxLength,
  error,
  className = "",
  ...rest
}) => {
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (dataType === "number") {
      if (
        [46, 8, 9, 27, 13, 110, 190].includes(e.keyCode) ||
        (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
        (e.keyCode >= 35 && e.keyCode <= 40)
      ) {
        return; 
      }
      if ((e.shiftKey || e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    } else if (dataType === "text" && !allowSpecialChars && !allowedCharsRegex) {
      if (
        [46, 8, 9, 27, 13].includes(e.keyCode) ||
        (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
        (e.keyCode >= 35 && e.keyCode <= 40) 
      ) {
        return; 
      }
      if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
        e.preventDefault();
      }
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let inputValue = e.target.value;

    if (dataType === "number") {
      inputValue = inputValue.replace(/[^0-9.]/g, ""); 
    } else if (dataType === "alphanumeric") {
      inputValue = inputValue.replace(/[^a-zA-Z0-9\s]/g, "");
    } else if (!allowSpecialChars) {
      inputValue = inputValue.replace(/[^a-zA-Z0-9\s]/g, "");
    } else if (allowedCharsRegex) {
      const sanitizedValue =
        inputValue.match(new RegExp(allowedCharsRegex.source, "g"))?.join("") || "";
      inputValue = sanitizedValue;
    }

    if (maxLength && inputValue.length > maxLength) {
      inputValue = inputValue.slice(0, maxLength);
    }

    e.target.value = inputValue;
    onChange(e);
  };

  const commonProps = {
    value,
    onChange: handleInputChange,
    onKeyDown: handleKeyDown,
    className: `w-full px-4  text-[0.85rem] py-2 pr-10 text-gray-700 border rounded-lg  focus:outline-none  focus:border-2   focus:border-[#4b92de] ${error ? "border-red-500" : "border-[#6a6a6a78]"} ${className}`,
    maxLength,
    ...rest,
  };

  const InputComponent = inputType === "textarea" ? "textarea" : "input";

  return (
    <div>
      <InputComponent {...commonProps} type={inputType === "textarea" ? undefined : "text"} />
      {error && (
        <div className="flex items-center mt-1 ml-2">
          <CircleAlert size={14} className="text-red-500" />
          <p className="ml-2 text-red-500 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default CustomInput;
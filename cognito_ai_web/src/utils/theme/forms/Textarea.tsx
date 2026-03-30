import React, { useState, ChangeEvent, FC } from "react";

interface TextareaProps {
    value: string;
    onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    className?: string;
}

const Textarea: FC<TextareaProps> = ({
                                         value,
                                         onChange,
                                         placeholder = "Enter text...",
                                         className = "",
                                     }) => {
    const [isActive, setIsActive] = useState(false);

    return (
        <div className={`w-full h-full max-w-full max-h-full ${className}`}>
      <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setIsActive(true)}
          onBlur={() => setIsActive(false)}
          className={`
          w-full
          min-h-[220px]
          resize
          max-w-full
          max-h-full
          rounded-lg
          border-2
          px-4 py-3
          text-base
          outline-none
          transition-all
          duration-200
          ${isActive ? "border-[#8051FF] shadow-sm" : "border-gray-300"}
          focus:border-blue-500
        `}
          style={{
              boxSizing: "border-box",
          }}
      />
        </div>
    );
};

export default Textarea;

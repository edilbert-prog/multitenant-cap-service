import React from "react";

const sizeMap = {
  xs: "h-4 w-4 border-2",
  sm: "h-6 w-6 border-2",
  md: "h-10 w-10 border-4",
  lg: "h-14 w-14 border-4",
} as const;

const colorMap = {
  "blue-500": "border-blue-500",
  "green-500": "border-green-500",
  "red-600": "border-red-600",
  "yellow-500": "border-yellow-500",
  "purple-500": "border-purple-500",
  white: "border-white",
} as const;

type SpinnerSize = keyof typeof sizeMap;
type SpinnerColor = keyof typeof colorMap;

type SpinnerProps = {
  size?: SpinnerSize;
  color?: SpinnerColor;
  text?: string;
  children?: React.ReactNode;
};

export default function Spinner({
                                  size = "md",
                                  color = "blue-500",
                                  text = "",
                                }: SpinnerProps) {
  const sizeClass = sizeMap[size];
  const colorClass = colorMap[color];

  return (
      <div className="flex flex-col justify-center items-center gap-2">
        <div
            className={`animate-spin rounded-full border-t-transparent ${sizeClass} ${colorClass}`}
        />
        {text && <span className="text-gray-600 text-sm">{text}</span>}
      </div>
  );
}

// import * as React from "react"

// import { cn } from "../lib/utils"

// function Input({ className, type, ...props }: React.ComponentProps<"input">) {
//   return (
//     <input
//       type={type}
//       data-slot="input"
//       className={cn(
//         "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
//         "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
//         "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
//         className
//       )}
//       {...props}
//     />
//   )
// }

// export { Input }



import * as React from "react";
import { cn } from "../lib/utils";
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
  inputClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputClassName, icon = "", type, ...props }, ref) => {
    if (icon) {
      return (
        <label className={cn("relative block w-full", className)}>

          <input
            autoComplete="off"
            data-testid=""
            type={type}
            className={cn(
              "nopan nodelete nodrag noflow form-input placeholder:text-gray-500 flex h-9 w-full min-w-0 rounded-md border border-gray-200 bg-white px-3 pl-9 text-sm shadow-sm transition-colors outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
              "focus:border-[#0071E9] focus:ring-2 focus:ring-[#0071E9]/20",
              "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
              inputClassName,
            )}
            ref={ref}
            {...props}
          />
        </label>
      );
    } else {
      return (
        <input
          data-testid=""
          type={type}
          className={cn(
            "nopan nodelete nodrag noflow form-input placeholder:text-gray-500 flex h-9 w-full min-w-0 rounded-md border border-gray-200 bg-white px-3 text-sm shadow-sm transition-colors outline-none focus:border-[#0071E9] focus:ring-2 focus:ring-[#0071E9]/20 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          ref={ref}
          {...props}
        />
      );
    }
  },
);
Input.displayName = "Input";

export { Input };


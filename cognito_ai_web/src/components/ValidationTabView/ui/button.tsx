import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "cursor-pointer noflow nopan nodelete nodrag inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#0071E9] text-white hover:bg-[#0071E9",
        destructive:
          "bg-red-600 text-white hover:bg-red-700",
        outline:
          "border border-[#0071E9] hover:bg-gray-50 text-[#0071E9] hover:text-[#0071E9]",
        outlineAmber:
          "border border-amber-500 text-amber-600 hover:bg-amber-50",
        primary:
          "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm",
        accent: 
          "bg-[#0071E9] text-white hover:bg-[#005ABA] shadow-sm",
        success:
          "bg-green-600 text-white hover:bg-green-700 shadow-sm",
        info:
          "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        warning:
          "bg-orange-600 text-white hover:bg-orange-700 shadow-sm",
        secondary:
          "border border-gray-200 bg-gray-50 text-gray-900 hover:bg-gray-100",
        danger: 'bg-red-600 text-white hover:bg-red-700',
        ghost:
          "text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:!bg-transparent",
        ghostActive:
          "bg-gray-100 text-gray-900 hover:bg-gray-200",
        menu: "hover:bg-gray-100 hover:text-gray-900 focus:!ring-0 focus-visible:!ring-0",
        "menu-active":
          "font-semibold hover:bg-gray-100 hover:text-gray-900 focus-visible:!ring-offset-0",
        link: "underline-offset-4 hover:underline text-[#0071E9]",
      },
      size: {
        default: "h-10 py-2 px-4",
        md: "h-8 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        xs: "py-0.5 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        iconMd: "p-1.5 rounded-md",
        icon: "p-1 rounded-md",
        iconSm: "p-0.5 rounded-md",
        "node-toolbar": "py-[5px] px-[5px] rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  unstyled?: boolean;
  ignoreTitleCase?: boolean;
}

function toTitleCase(text: string) {
  return text
    ?.split(" ")
    ?.map(
      (word) => word?.charAt(0)?.toUpperCase() + word?.slice(1)?.toLowerCase(),
    )
    ?.join(" ");
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      unstyled,
      size,
      loading,
      type,
      disabled,
      asChild = false,
      children,
      ignoreTitleCase = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    let newChildren = children;
    if (typeof children === "string") {
      newChildren = ignoreTitleCase ? children : toTitleCase(children);
    }
    return (
      <>
        <Comp
          className={
            !unstyled
              ? buttonVariants({ variant, size, className })
              : cn(className)
          }
          disabled={loading || disabled}
          {...(asChild ? {} : { type: type || "button" })}
          ref={ref}
          {...props}
        >
          {loading ? (
            <span className="relative flex items-center justify-center">
              <span className="invisible">{newChildren}</span>
              <span className="absolute inset-0 flex items-center justify-center">
              </span>
            </span>
          ) : (
            newChildren
          )}
        </Comp>
      </>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };


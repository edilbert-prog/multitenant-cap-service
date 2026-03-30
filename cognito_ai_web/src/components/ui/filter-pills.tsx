import * as React from "react"
import { cn } from "@/components/ValidationTabView/lib/utils"

export interface FilterPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  count?: number
  variant?: 'default' | 'success' | 'destructive' | 'warning' | 'info'
}

const variantStyles = {
  default: {
    active: "bg-primary text-primary-foreground",
    inactive: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  },
  success: {
    active: "bg-[hsl(var(--color-success))] text-[hsl(var(--color-success-foreground))]",
    inactive: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  },
  destructive: {
    active: "bg-destructive text-destructive-foreground",
    inactive: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  },
  warning: {
    active: "bg-[hsl(var(--color-warning))] text-[hsl(var(--color-warning-foreground))]",
    inactive: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  },
  info: {
    active: "bg-[hsl(var(--color-info))] text-[hsl(var(--color-info-foreground))]",
    inactive: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  }
}

const FilterPill = React.forwardRef<HTMLButtonElement, FilterPillProps>(
  ({ className, active = false, count, variant = 'default', children, ...props }, ref) => {
    const styles = variantStyles[variant]

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          active ? styles.active : styles.inactive,
          className
        )}
        {...props}
      >
        {children}
        {count !== undefined && (
          <span className={cn(
            "rounded-md px-2 py-0.5 text-xs font-semibold",
            active ? "bg-black/10" : "bg-muted"
          )}>
            {count}
          </span>
        )}
      </button>
    )
  }
)
FilterPill.displayName = "FilterPill"

export interface FilterPillsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const FilterPills = React.forwardRef<HTMLDivElement, FilterPillsProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2 flex-wrap", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FilterPills.displayName = "FilterPills"

export { FilterPill, FilterPills }

import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "info" | "warning" | "danger" | "outline" | "primary"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-white": variant === "default" || variant === "primary",
          "border-transparent bg-success text-white": variant === "success",
          "border-transparent bg-info text-white": variant === "info",
          "border-transparent bg-warning text-white": variant === "warning",
          "border-transparent bg-danger text-white": variant === "danger",
          "text-foreground border-border": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }

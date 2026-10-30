import React from "react";
import { cn } from "../../lib/utils";

export const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", isLoading, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2.5 font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] rounded-[7px] text-sm";

    const variants = {
      default:
        "bg-[#1D4ED8] text-white hover:bg-[#1E40AF] shadow-[0_2px_6px_rgba(29,78,216,0.25)]",
      secondary:
        "bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0] hover:bg-[#F1F5F9] shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
      ghost: "text-[#1D4ED8] hover:bg-blue-50/50",
      outline: "border border-[#E2E8F0] text-[#0F172A] bg-white hover:bg-slate-50",
    };

    const sizes = {
      default: "h-[50px] px-4 py-2",
      sm: "h-[38px] px-3 text-xs",
      lg: "h-[54px] px-6 text-base",
      icon: "h-[40px] w-[40px] p-0",
    };

    const spinnerBorderClass =
      variant === "default" || variant === "primary" || !variant
        ? "border-white/30 border-t-white"
        : "border-[#1D4ED8]/25 border-t-[#1D4ED8]";

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className, "relative")}
        disabled={isLoading || props.disabled}
        aria-busy={isLoading ? "true" : undefined}
        {...props}
      >
        {isLoading && (
          <span
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <span
              className={cn(
                "rounded-full border-2 animate-spin shrink-0",
                size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5",
                spinnerBorderClass
              )}
            />
            <span className="sr-only">جاري التحميل...</span>
          </span>
        )}
        <span
          className={cn(
            "inline-flex items-center justify-center gap-2.5",
            isLoading && "invisible opacity-0 select-none pointer-events-none"
          )}
          aria-hidden={isLoading ? "true" : undefined}
        >
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

import React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef(
  ({ className, type, icon: Icon, leftElement, ...props }, ref) => {
    return (
      <div className="relative w-full flex items-center">
        {/* Right Icon for Arabic RTL */}
        {Icon && (
          <div className="absolute right-4 text-[#94A3B8] pointer-events-none flex items-center justify-center z-10">
            <Icon size={19} />
          </div>
        )}

        <input
          type={type}
          className={cn(
            "flex h-[52px] w-full rounded-[7px] border border-[#E2E8F0] bg-white text-[0.95rem] text-[#0F172A] shadow-[0_1px_3px_rgba(15,23,42,0.04)] placeholder:text-[#94A3B8] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/10 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
            Icon ? "pr-12 pl-4" : "px-4",
            leftElement ? "pl-12" : "",
            className
          )}
          style={{
            paddingRight: Icon ? "48px" : "16px",
            paddingLeft: leftElement ? "48px" : "16px",
          }}
          ref={ref}
          {...props}
        />

        {/* Left Action (e.g., eye toggle) */}
        {leftElement && (
          <div className="absolute left-3.5 flex items-center justify-center z-10">
            {leftElement}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

import React from "react";
import { cn } from "@/lib/utils";

export interface PopButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md";
  pressed?: boolean;
}

export function PopButton({
  className,
  children = "Learn More",
  size = "md",
  pressed = false,
  type = "button",
  ...props
}: PopButtonProps) {
  const sm = size === "sm";

  return (
    <button
      type={type}
      aria-pressed={pressed || undefined}
      className={cn(
        "group relative inline-flex items-center justify-center font-semibold uppercase tracking-wider text-[#382b22] dark:text-[#382b22]",
        "border-2 border-[#b18597] bg-[#f9d4d4]",
        "transition-all duration-150 ease-[cubic-bezier(0,0,0.58,1)]",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0a0a0]",
        "disabled:pointer-events-none disabled:opacity-40",
        sm
          ? "rounded-lg px-4 py-2 text-xs"
          : "rounded-xl px-8 py-5",
        sm
          ? pressed
            ? "translate-y-1.5 shadow-[0_0px_0_-2px_#f9c4d2,0_0px_0_0_#b18597] bg-[#f3c8c8]"
            : "shadow-[0_6px_0_-2px_#f9c4d2,0_6px_0_0_#b18597] hover:translate-y-0.5 hover:bg-[#fce0e0] hover:shadow-[0_4px_0_-2px_#f9c4d2,0_4px_0_0_#b18597] active:translate-y-1.5 active:shadow-[0_0px_0_-2px_#f9c4d2,0_0px_0_0_#b18597]"
          : pressed
            ? "translate-y-3 shadow-[0_0px_0_-2px_#f9c4d2,0_0px_0_0_#b18597,0_0px_0_0_#ffe3e2] bg-[#f3c8c8]"
            : [
                "shadow-[0_12px_0_-2px_#f9c4d2,0_12px_0_0_#b18597,0_22px_0_0_#ffe3e2]",
                "dark:shadow-[0_12px_0_-2px_#f9c4d2,0_12px_0_0_#b18597,0_22px_15px_-5px_rgba(0,0,0,0.3)]",
                "hover:translate-y-1 hover:bg-[#fce0e0] hover:shadow-[0_8px_0_-2px_#f9c4d2,0_8px_0_0_#b18597,0_16px_0_0_#ffe3e2]",
                "dark:hover:shadow-[0_8px_0_-2px_#f9c4d2,0_8px_0_0_#b18597,0_16px_10px_-5px_rgba(0,0,0,0.3)]",
                "active:translate-y-3 active:bg-[#fce0e0] active:shadow-[0_0px_0_-2px_#f9c4d2,0_0px_0_0_#b18597,0_0px_0_0_#ffe3e2]",
                "dark:active:shadow-[0_0px_0_-2px_#f9c4d2,0_0px_0_0_#b18597,0_0px_0_0_rgba(0,0,0,0)]",
              ],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default PopButton;

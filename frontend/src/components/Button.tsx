import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-pine text-cream hover:bg-pine-deep",
  accent: "bg-marigold text-ink hover:bg-marigold-deep",
  ghost: "bg-transparent text-ink border border-line hover:border-ink-soft",
  danger: "bg-transparent text-terracotta border border-terracotta/40 hover:bg-terracotta/10",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[8px] px-7 py-3.5 font-semibold text-sm transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none",
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

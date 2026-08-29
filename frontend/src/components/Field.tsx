import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <label className="flex flex-col gap-1.5" htmlFor={inputId}>
        <span className="text-[0.8125rem] font-semibold tracking-[0.01em] text-ink">
          {label}
        </span>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "rounded-[8px] border bg-cream px-4 py-3 text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-pine focus:ring-2 focus:ring-pine/30",
            error ? "border-terracotta" : "border-line",
            className,
          )}
          {...props}
        />
        {error ? (
          <span className="text-[0.8125rem] text-terracotta">{error}</span>
        ) : null}
      </label>
    );
  },
);
Field.displayName = "Field";

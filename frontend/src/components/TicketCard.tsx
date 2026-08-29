import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TicketCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * The product's signature component: a torn-stub card with a perforated
 * top edge, per DESIGN.md's "Counter Ticket" world. The dots read as
 * cutouts against the page background, so this must sit on bg-cream.
 */
export function TicketCard({ children, className }: TicketCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[12px] border border-line bg-cream-panel px-6 py-10 shadow-ticket sm:px-10",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute -top-[7px] left-0 right-0 h-[14px] bg-[radial-gradient(circle_7px_at_12px_7px,var(--color-cream)_99%,transparent_100%)] [background-size:24px_14px] [background-repeat:repeat-x]"
      />
      {children}
    </div>
  );
}

import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_MODE, DEMO_BADGE_TEXT } from "@/lib/demo";

/**
 * Small badge shown wherever sample data may appear while Demo Mode is on.
 * Renders nothing when NEXT_PUBLIC_DEMO_MODE is not "true".
 */
export function DemoBadge({
  className,
  label = DEMO_BADGE_TEXT,
}: {
  className?: string;
  label?: string;
}) {
  if (!DEMO_MODE) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold-foreground",
        className,
      )}
    >
      <FlaskConical className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

/** Inline pill used on demo cards e.g. "DEMO LISTING". */
export function DemoTag({
  className,
  children = "DEMO",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded bg-gold/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-foreground shadow-sm",
        className,
      )}
    >
      {children}
    </span>
  );
}

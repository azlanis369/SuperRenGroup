import { cn } from "@/lib/utils";

/** Super Ren Group wordmark + emblem. */
export function Logo({
  className,
  compact = false,
  subtitle = "Property CRM",
}: {
  className?: string;
  compact?: boolean;
  /** Small label under the wordmark. Use a public label (e.g. "Real Estate")
   * on public pages so the brand doesn't read as an internal CRM. */
  subtitle?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <BuildingMark className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            Super Ren <span className="text-gold">Group</span>
          </span>
          {subtitle ? (
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {subtitle}
            </span>
          ) : null}
        </span>
      )}
    </div>
  );
}

function BuildingMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 21V7l6-3 6 3v14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 21V10l4 2v9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12h2M9 16h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

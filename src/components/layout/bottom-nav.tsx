"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV } from "./nav-config";
import { useLanguage } from "@/contexts/language-context";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden pb-safe">
      <div className="grid grid-cols-5">
        {BOTTOM_NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/listings/new"
              ? pathname === "/listings/new"
              : item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          const isAdd = item.href === "/listings/new";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {isAdd ? (
                <span className="flex h-9 w-9 -mt-3 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-elevated">
                  <Icon className="h-5 w-5" />
                </span>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              {t.nav[item.labelKey]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

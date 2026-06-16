"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SIDEBAR_NAV, visibleNav } from "./nav-config";
import type { Role } from "@/lib/constants";
import { Logo } from "@/components/brand";
import { useLanguage } from "@/contexts/language-context";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const items = visibleNav(SIDEBAR_NAV, role);

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card">
      <div className="flex h-16 items-center px-5 border-b border-border">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {t.nav[item.labelKey]}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        Super Ren Group · v0.1
      </div>
    </aside>
  );
}

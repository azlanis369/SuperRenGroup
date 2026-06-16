"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "all", label: "All" },
  { key: "project", label: "Project" },
  { key: "subsale", label: "Subsale" },
  { key: "rental", label: "Rental" },
  { key: "available", label: "Available" },
  { key: "booked", label: "Booked" },
  { key: "sold", label: "Sold/Rented" },
  { key: "draft", label: "Draft" },
];

export function ListingsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const activeTab = params.get("tab") ?? "all";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setParam("q", q)}
            placeholder="Cari tajuk listing…"
            className="pl-9"
          />
        </div>
        {isPending ? (
          <div className="flex items-center px-2">
            <Spinner />
          </div>
        ) : null}
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setParam("tab", tab.key)}
            className={cn(
              "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-secondary",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

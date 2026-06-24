"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X, Users, Mail, MapPin, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { ContactRow, ContactRole, ContactSegment } from "@/lib/data/contacts";
import type { AgentStamp } from "@/lib/share";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FollowUpActions } from "@/components/deals/follow-up-actions";

type RoleFilter = "all" | ContactRole;
type SegFilter = "all" | ContactSegment;

const ROLE_TONE: Record<ContactRole, "primary" | "info"> = {
  client: "primary",
  prospect: "info",
};

export function ContactBoard({
  contacts,
  agent,
}: {
  contacts: ContactRow[];
  agent?: AgentStamp;
}) {
  const { t } = useLanguage();
  const tc = t.contacts;
  const [q, setQ] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [seg, setSeg] = useState<SegFilter>("all");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return contacts.filter((c) => {
      if (role !== "all" && c.role !== role) return false;
      if (seg !== "all" && c.segment !== seg) return false;
      if (needle) {
        const hay = `${c.name} ${c.phone ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [contacts, q, role, seg]);

  const clients = contacts.filter((c) => c.role === "client").length;
  const prospects = contacts.length - clients;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Kpi label={tc.total} value={contacts.length} accent="text-primary" />
        <Kpi label={tc.clients} value={clients} accent="text-emerald-600" />
        <Kpi label={tc.prospects} value={prospects} accent="text-sky-600" />
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tc.searchPlaceholder}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-9 text-sm outline-none focus:border-primary"
          />
          {q ? (
            <button
              onClick={() => setQ("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip active={role === "all" && seg === "all"} onClick={() => { setRole("all"); setSeg("all"); }}>
          {t.common.all}
        </Chip>
        <Chip active={role === "client"} onClick={() => setRole(role === "client" ? "all" : "client")}>
          {tc.roleLabel.client}
        </Chip>
        <Chip active={role === "prospect"} onClick={() => setRole(role === "prospect" ? "all" : "prospect")}>
          {tc.roleLabel.prospect}
        </Chip>
        <Chip active={seg === "buyer"} onClick={() => setSeg(seg === "buyer" ? "all" : "buyer")}>
          {tc.segmentLabel.buyer}
        </Chip>
        <Chip active={seg === "tenant"} onClick={() => setSeg(seg === "tenant" ? "all" : "tenant")}>
          {tc.segmentLabel.tenant}
        </Chip>
      </div>

      <p className="text-xs text-muted-foreground">{tc.count(rows.length)}</p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 h-6 w-6 opacity-50" />
          {contacts.length === 0 ? tc.empty : tc.noMatch}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold leading-tight">{c.name}</p>
                <Badge tone={ROLE_TONE[c.role]}>{tc.roleLabel[c.role]}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge tone="neutral">{tc.segmentLabel[c.segment]}</Badge>
                {c.phone ? (
                  <span className="text-xs text-muted-foreground">{c.phone}</span>
                ) : null}
              </div>

              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {c.email ? (
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {c.email}
                  </p>
                ) : null}
                {c.area ? (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {tc.area}: {c.area}
                  </p>
                ) : null}
                {c.budget ? (
                  <p className="flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" /> {tc.budget}: {c.budget}
                  </p>
                ) : null}
              </div>

              {c.listingTitle ? (
                c.listingId ? (
                  <Link
                    href={`/listings/${c.listingId}`}
                    className="mt-2 line-clamp-1 block text-xs text-primary hover:underline"
                  >
                    {c.listingTitle}
                  </Link>
                ) : (
                  <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                    {c.listingTitle}
                  </p>
                )
              ) : null}

              {c.phone ? (
                <FollowUpActions
                  phone={c.phone}
                  kind={c.role === "client" ? "deal" : "lead"}
                  status={c.status}
                  customerName={c.name}
                  listingTitle={c.listingTitle}
                  agent={agent}
                />
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", accent)}>{value}</p>
    </Card>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

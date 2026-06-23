"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const AGENTS = [
  { id: "user-aiman", name: "Aiman Hakimi" },
  { id: "user-siti", name: "Siti Hajar" },
  { id: "user-daniel", name: "Daniel Lim" },
  { id: "user-harith", name: "Harith Z." },
];

const PRIMARY = [
  { id: "user-azlan", name: "Amirul Nasyriq", role: "Group Team Manager" },
];

async function setPersona(role: string) {
  await fetch("/api/demo/persona", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
}

export function DemoPersonaSwitcher() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function enter(role: string) {
    setLoading(role);
    await setPersona(role);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-medium text-foreground">
        Masuk demo sebagai:
      </p>
      <div className="grid grid-cols-2 gap-2">
        {PRIMARY.map((p, i) => (
          <Button
            key={p.id}
            variant={i === 0 ? "gold" : "default"}
            onClick={() => enter(p.id)}
            disabled={!!loading}
            className="h-auto flex-col gap-0.5 py-2.5"
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              {loading === p.id ? (
                <Spinner />
              ) : i === 0 ? (
                <UserRound className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {p.name}
            </span>
            <span className="text-[10px] font-normal opacity-80">{p.role}</span>
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {AGENTS.map((a) => (
          <Button
            key={a.id}
            variant="outline"
            size="sm"
            onClick={() => enter(a.id)}
            disabled={!!loading}
          >
            {loading === a.id ? <Spinner /> : <UserRound className="h-4 w-4" />}
            {a.name}
          </Button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => enter("user-superadmin")}
        disabled={!!loading}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
      >
        Masuk sebagai Super Admin
      </button>
    </div>
  );
}

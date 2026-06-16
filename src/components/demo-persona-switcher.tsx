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
        <Button onClick={() => enter("user-admin")} disabled={!!loading}>
          {loading === "user-admin" ? <Spinner /> : <ShieldCheck className="h-4 w-4" />}
          Admin
        </Button>
        <Button
          variant="gold"
          onClick={() => enter("user-superadmin")}
          disabled={!!loading}
        >
          {loading === "user-superadmin" ? <Spinner /> : <ShieldCheck className="h-4 w-4" />}
          Super Admin
        </Button>
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
    </div>
  );
}

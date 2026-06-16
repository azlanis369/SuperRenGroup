"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import { Logo } from "@/components/brand";
import { DemoBadge } from "@/components/demo-badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Topbar({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl?: string | null;
}) {
  const router = useRouter();
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function signOut() {
    if (!LOCAL_DEMO) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
      <div className="lg:hidden">
        <Logo compact />
      </div>
      <div className="hidden lg:block">
        <DemoBadge />
      </div>
      <div className="flex items-center gap-2">
        <DemoBadge className="lg:hidden" label="Demo" />
        <Link href="/profile">
          <Avatar className="h-9 w-9 border border-border">
            {photoUrl ? <AvatarImage src={photoUrl} alt={name} /> : null}
            <AvatarFallback className="text-xs">
              {initials || <UserRound className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={signOut}
          title="Log keluar"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

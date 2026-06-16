"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLanguage } from "@/contexts/language-context";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  async function onSignOut() {
    setLoading(true);
    if (!LOCAL_DEMO) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={onSignOut} disabled={loading}>
      {loading ? <Spinner /> : <LogOut className="h-4 w-4" />}
      {t.settings.signOut}
    </Button>
  );
}

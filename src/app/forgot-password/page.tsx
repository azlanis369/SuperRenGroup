"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { absoluteUrl } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: absoluteUrl("/reset-password"),
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {sent ? (
            <div className="text-center">
              <h1 className="text-lg font-semibold">Semak emel anda</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Jika akaun wujud untuk{" "}
                <span className="font-medium text-foreground">{email}</span>,
                kami telah hantar pautan set semula kata laluan.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <h1 className="text-lg font-semibold">Set semula kata laluan</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Masukkan emel anda untuk menerima pautan.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Emel</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner /> : null}
                Hantar pautan
              </Button>
            </form>
          )}
        </div>
        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke log masuk
        </Link>
      </div>
    </div>
  );
}

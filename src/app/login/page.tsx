import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand";
import { DemoBadge } from "@/components/demo-badge";
import { LoginForm } from "./login-form";
import { DEMO_MODE } from "@/lib/demo";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import { DemoPersonaSwitcher } from "@/components/demo-persona-switcher";

export const metadata: Metadata = { title: "Log Masuk" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo />
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
              Selamat kembali
            </h1>
            <p className="mt-1 text-sm text-muted-foreground text-balance">
              Manage listings. Share faster. Close smarter.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            {LOCAL_DEMO ? (
              <DemoPersonaSwitcher />
            ) : (
              <Suspense fallback={<div className="h-64" />}>
                <LoginForm />
              </Suspense>
            )}
          </div>

          {LOCAL_DEMO ? (
            <div className="mt-6 rounded-xl border border-gold/30 bg-gold/5 p-4 text-center">
              <DemoBadge className="mx-auto" />
              <p className="mt-2 text-xs text-muted-foreground">
                Mod demo tempatan aktif — tiada Supabase diperlukan. Pilih persona
                untuk teroka aplikasi dengan data contoh.
              </p>
            </div>
          ) : DEMO_MODE ? (
            <div className="mt-6 rounded-xl border border-gold/30 bg-gold/5 p-4 text-center">
              <DemoBadge className="mx-auto" />
              <p className="mt-2 text-xs text-muted-foreground">
                Akaun demo:
                <br />
                <span className="font-mono text-foreground">
                  admin@superren.demo
                </span>{" "}
                /{" "}
                <span className="font-mono text-foreground">
                  aiman@superren.demo
                </span>
                <br />
                Kata laluan:{" "}
                <span className="font-mono text-foreground">DemoPass123!</span>
              </p>
            </div>
          ) : null}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link href="/legal/terms" className="hover:text-foreground">
              Terma
            </Link>{" "}
            ·{" "}
            <Link href="/legal/privacy" className="hover:text-foreground">
              Privasi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

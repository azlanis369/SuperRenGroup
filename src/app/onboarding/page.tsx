import type { Metadata } from "next";
import { Logo } from "@/components/brand";
import { DemoBadge } from "@/components/demo-badge";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = { title: "Lengkapkan Profil" };

export default async function OnboardingPage() {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
        <Logo />
        <DemoBadge />
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Lengkapkan profil anda
          </h1>
          <p className="mt-1 text-muted-foreground">
            Lengkapkan maklumat ini untuk mula menggunakan Super Ren Group dan
            menjana kad bisnes digital anda.
          </p>
        </div>
        <ProfileForm
          profile={user.profile}
          defaultEmail={user.email}
          mode="onboarding"
        />
      </main>
    </div>
  );
}

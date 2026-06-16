import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, QrCode } from "lucide-react";
import { requireOnboardedUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { Button } from "@/components/ui/button";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const user = await requireOnboardedUser();
  const slug = user.profile?.slug;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            Kemas kini kad bisnes digital awam anda.
          </p>
        </div>
        {slug ? (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/agent/${slug}`} target="_blank">
                <ExternalLink className="h-4 w-4" /> Lihat profil awam
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/agent/${slug}/card`} target="_blank">
                <QrCode className="h-4 w-4" /> QR
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      {slug ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Pautan awam:{" "}
          <span className="font-mono text-foreground">
            {absoluteUrl(`/agent/${slug}`)}
          </span>
        </p>
      ) : null}

      <ProfileForm profile={user.profile} defaultEmail={user.email} mode="edit" />
    </div>
  );
}

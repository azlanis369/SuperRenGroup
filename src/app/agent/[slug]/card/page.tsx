import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicAgent } from "@/lib/data/agents";
import { absoluteUrl } from "@/lib/utils";
import { Logo } from "@/components/brand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { QrCode } from "@/components/public/qr-code";

export const metadata: Metadata = { title: "Kad QR" };

export default async function AgentCardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicAgent(slug);
  if (!data) notFound();
  const { profile } = data;
  const name = profile.display_name || profile.full_name;
  const url = absoluteUrl(`/agent/${slug}`);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card text-center shadow-elevated">
        <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pb-6 pt-8 text-primary-foreground">
          <Avatar className="mx-auto h-24 w-24 border-4 border-white/20">
            {profile.profile_photo_url ? (
              <AvatarImage src={profile.profile_photo_url} alt={name} />
            ) : null}
            <AvatarFallback className="bg-card text-2xl text-foreground">
              {name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </AvatarFallback>
          </Avatar>
          <h1 className="mt-3 text-xl font-bold">{name}</h1>
          {profile.ren_number ? (
            <p className="text-sm text-white/80">{profile.ren_number}</p>
          ) : null}
          {profile.agency_name ? (
            <p className="text-sm text-white/80">{profile.agency_name}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-center p-6">
          <div className="rounded-2xl border border-border p-3">
            <QrCode value={url} size={180} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Imbas untuk lihat profil & listing
          </p>
          <p className="mt-1 break-all text-xs text-muted-foreground">{url}</p>
          <div className="mt-5">
            <Logo />
          </div>
        </div>
      </div>
    </div>
  );
}

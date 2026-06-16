"use client";

import Link from "next/link";
import { MessageCircle, Phone, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toWaNumber } from "@/lib/utils";

type Agent = {
  full_name: string;
  display_name?: string | null;
  slug: string;
  profile_photo_url?: string | null;
  ren_number?: string | null;
  agency_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
};

export function AgentContactCard({
  agent,
  whatsappUrl,
  showPhone = true,
  enableWhatsApp = true,
}: {
  agent: Agent;
  whatsappUrl: string;
  showPhone?: boolean;
  enableWhatsApp?: boolean;
}) {
  const name = agent.display_name || agent.full_name;
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <Link href={`/agent/${agent.slug}`} className="flex items-center gap-3">
        <Avatar className="h-14 w-14 border border-border">
          {agent.profile_photo_url ? (
            <AvatarImage src={agent.profile_photo_url} alt={name} />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold leading-tight">{name}</p>
          {agent.ren_number ? (
            <p className="text-xs text-muted-foreground">{agent.ren_number}</p>
          ) : null}
          {agent.agency_name ? (
            <p className="truncate text-xs text-muted-foreground">
              {agent.agency_name}
            </p>
          ) : null}
        </div>
      </Link>

      <div className="mt-4 space-y-2">
        {enableWhatsApp && agent.whatsapp ? (
          <Button asChild variant="success" className="w-full">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> Saya berminat dengan listing
              ini
            </a>
          </Button>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          {showPhone && agent.phone ? (
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${toWaNumber(agent.phone)}`}>
                <Phone className="h-4 w-4" /> Call
              </a>
            </Button>
          ) : null}
          {agent.email ? (
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${agent.email}`}>
                <Mail className="h-4 w-4" /> Email
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

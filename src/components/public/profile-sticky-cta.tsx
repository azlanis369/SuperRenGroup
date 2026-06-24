"use client";

import { MessageCircle, Phone } from "lucide-react";
import { track } from "@/lib/analytics";
import { ProfileShareButton } from "@/components/public/profile-share-button";

/**
 * Mobile-only sticky action bar on the public agent profile so prospects can
 * reach WhatsApp / Call / Share without scrolling. Hidden on lg+.
 */
export function ProfileStickyCta({
  whatsappUrl,
  phone,
  url,
  name,
}: {
  whatsappUrl: string;
  phone?: string | null;
  url: string;
  name: string;
}) {
  const tel = phone ? phone.replace(/[^\d+]/g, "") : null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-4xl items-center gap-2">
        {whatsappUrl !== "#" ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("click_whatsapp_profile", { source: "sticky" })}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        ) : null}
        {tel ? (
          <a
            href={`tel:${tel}`}
            onClick={() => track("click_call_profile", { source: "sticky" })}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Phone className="h-4 w-4" /> Call
          </a>
        ) : null}
        <ProfileShareButton url={url} name={name} />
      </div>
    </div>
  );
}

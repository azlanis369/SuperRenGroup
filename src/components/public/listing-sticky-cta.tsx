"use client";

import { MessageCircle, Phone } from "lucide-react";
import { ShareButton } from "@/components/listings/share-button";
import { track } from "@/lib/analytics";
import type { AgentStamp } from "@/lib/share";

type ShareListing = {
  id: string;
  title: string;
  slug: string;
  area: string;
  price?: number | null;
  price_display?: string | null;
  top_selling_points?: string[];
};

/**
 * Mobile-only sticky action bar for the public listing detail page so a
 * prospect can reach WhatsApp / Call / Share without scrolling to the sidebar.
 * Hidden on lg+ where the agent contact card is already visible.
 */
export function ListingStickyCta({
  listing,
  agent,
  whatsappUrl,
  phone,
  showPhone = true,
  enableWhatsApp = true,
}: {
  listing: ShareListing;
  agent?: AgentStamp;
  whatsappUrl: string;
  phone?: string | null;
  showPhone?: boolean;
  enableWhatsApp?: boolean;
}) {
  const tel = phone ? phone.replace(/[^\d+]/g, "") : null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(11,31,51,0.10)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-5xl items-center gap-2">
        {enableWhatsApp ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("click_whatsapp_listing", { listingId: listing.id })}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        ) : null}
        {showPhone && tel ? (
          <a
            href={`tel:${tel}`}
            onClick={() => track("click_call_listing", { listingId: listing.id })}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Phone className="h-4 w-4" /> Call
          </a>
        ) : null}
        <ShareButton listing={listing} agent={agent} variant="outline" size="icon-sm" />
      </div>
    </div>
  );
}

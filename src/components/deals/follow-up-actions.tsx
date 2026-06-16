"use client";

import { MessageCircle, Phone, MessageSquare } from "lucide-react";
import { toWaNumber } from "@/lib/utils";
import { buildFollowUpMessage, type AgentStamp } from "@/lib/share";

/**
 * Quick follow-up actions for contacting a customer/lead directly:
 * WhatsApp (prefilled), Call, and SMS (prefilled). Messenger is omitted
 * because it needs a Facebook ID, not a phone number.
 */
export function FollowUpActions({
  phone,
  customerName,
  listingTitle,
  agent,
}: {
  phone: string;
  customerName?: string | null;
  listingTitle?: string | null;
  agent?: AgentStamp;
}) {
  const wa = toWaNumber(phone);
  const tel = phone.replace(/[^\d+]/g, "");
  const msg = encodeURIComponent(
    buildFollowUpMessage(customerName, listingTitle, agent),
  );

  return (
    <div className="mt-2 grid grid-cols-3 gap-1.5">
      <a
        href={`https://wa.me/${wa}?text=${msg}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center gap-1 rounded-lg bg-emerald-500 px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
      >
        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
      </a>
      <a
        href={`tel:${tel}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <Phone className="h-3.5 w-3.5" /> Call
      </a>
      <a
        href={`sms:${tel}?body=${msg}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <MessageSquare className="h-3.5 w-3.5" /> SMS
      </a>
    </div>
  );
}

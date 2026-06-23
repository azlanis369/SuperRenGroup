"use client";

import { Phone, MessageSquare } from "lucide-react";
import { buildFollowUpMessage, type AgentStamp } from "@/lib/share";
import { MessageAssistant } from "@/components/deals/message-assistant";

/**
 * Quick follow-up actions for a customer/lead:
 *  - WhatsApp via the Autobot (stage-aware drafted messages + guidance)
 *  - Call (tel:) and SMS (prefilled).
 * Messenger is omitted (needs a Facebook ID, not a phone number).
 */
export function FollowUpActions({
  phone,
  kind,
  status,
  customerName,
  listingTitle,
  priceText,
  agent,
}: {
  phone: string;
  kind: "deal" | "lead";
  status: string;
  customerName?: string | null;
  listingTitle?: string | null;
  priceText?: string | null;
  agent?: AgentStamp;
}) {
  const tel = phone.replace(/[^\d+]/g, "");
  const smsBody = encodeURIComponent(
    buildFollowUpMessage(customerName, listingTitle, agent),
  );

  return (
    <div className="mt-2 grid grid-cols-3 gap-1.5">
      <MessageAssistant
        phone={phone}
        kind={kind}
        status={status}
        customerName={customerName}
        listingTitle={listingTitle}
        priceText={priceText}
        agent={agent}
      />
      <a
        href={`tel:${tel}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <Phone className="h-3.5 w-3.5" /> Call
      </a>
      <a
        href={`sms:${tel}?body=${smsBody}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <MessageSquare className="h-3.5 w-3.5" /> SMS
      </a>
    </div>
  );
}

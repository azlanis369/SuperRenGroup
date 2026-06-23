"use client";

import { useState } from "react";
import { Share2, Copy, Send, Check, MessageCircle } from "lucide-react";
import {
  buildTelegramShareUrl,
  buildShareMessage,
  type AgentStamp,
} from "@/lib/share";
import { absoluteUrl } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useWhatsApp } from "@/components/whatsapp/whatsapp-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ShareListing = {
  id: string;
  title: string;
  slug: string;
  area: string;
  price?: number | null;
  price_display?: string | null;
  top_selling_points?: string[];
};

async function trackShare(listingId: string, channel: string) {
  try {
    await fetch("/api/public/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, channel }),
    });
  } catch {
    // best-effort tracking
  }
}

export function ShareButton({
  listing,
  agent,
  variant = "outline",
  size = "sm",
  label,
}: {
  listing: ShareListing;
  agent?: AgentStamp;
  variant?: "outline" | "default" | "ghost" | "gold";
  size?: "sm" | "default" | "icon-sm";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { lang, t } = useLanguage();
  const { open: openWhatsApp } = useWhatsApp();
  const ts = t.share;

  const publicUrl = absoluteUrl(`/listing/${listing.slug}`);

  function shareWhatsApp() {
    trackShare(listing.id, "whatsapp");
    openWhatsApp({ text: buildShareMessage(listing, agent, lang) });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    trackShare(listing.id, "copy_link");
    setTimeout(() => setCopied(false), 1800);
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(buildShareMessage(listing, agent, lang));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Share2 className="h-4 w-4" />
          {label ?? (size !== "icon-sm" ? ts.button : "")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ts.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Button
            variant="success"
            className="w-full justify-start"
            onClick={shareWhatsApp}
          >
            <MessageCircle className="h-4 w-4" /> {ts.whatsapp}
          </Button>
          <Button
            asChild
            variant="default"
            className="w-full justify-start"
            onClick={() => trackShare(listing.id, "telegram")}
          >
            <a
              href={buildTelegramShareUrl(listing, agent, lang)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Send className="h-4 w-4" /> {ts.telegram}
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={copyLink}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {ts.copyLink}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={copyMessage}
          >
            <Copy className="h-4 w-4" /> {ts.copyMessage}
          </Button>
        </div>
        <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          {publicUrl}
        </p>
      </DialogContent>
    </Dialog>
  );
}

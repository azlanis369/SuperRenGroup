"use client";

import { useState } from "react";
import { Share2, Copy, Send, Check, MessageCircle } from "lucide-react";
import {
  buildWhatsAppShareUrl,
  buildTelegramShareUrl,
  buildShareMessage,
} from "@/lib/share";
import { absoluteUrl } from "@/lib/utils";
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
  variant = "outline",
  size = "sm",
  label,
}: {
  listing: ShareListing;
  variant?: "outline" | "default" | "ghost" | "gold";
  size?: "sm" | "default" | "icon-sm";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = absoluteUrl(`/listing/${listing.slug}`);

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    trackShare(listing.id, "copy_link");
    setTimeout(() => setCopied(false), 1800);
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(buildShareMessage(listing));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Share2 className="h-4 w-4" />
          {label ?? (size !== "icon-sm" ? "Share" : "")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kongsi listing</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Button
            asChild
            variant="success"
            className="w-full justify-start"
            onClick={() => trackShare(listing.id, "whatsapp")}
          >
            <a
              href={buildWhatsAppShareUrl(listing)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" /> Kongsi ke WhatsApp
            </a>
          </Button>
          <Button
            asChild
            variant="default"
            className="w-full justify-start"
            onClick={() => trackShare(listing.id, "telegram")}
          >
            <a
              href={buildTelegramShareUrl(listing)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Send className="h-4 w-4" /> Kongsi ke Telegram
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={copyLink}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Salin pautan awam
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={copyMessage}
          >
            <Copy className="h-4 w-4" /> Salin mesej penuh
          </Button>
        </div>
        <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          {publicUrl}
        </p>
      </DialogContent>
    </Dialog>
  );
}

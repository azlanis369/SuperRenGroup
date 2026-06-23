"use client";

import { useState } from "react";
import { Bot, MessageCircle, Copy, Check } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useWhatsApp } from "@/components/whatsapp/whatsapp-provider";
import { messagePack, type MsgCtx, type Tone } from "@/lib/message-templates";
import type { AgentStamp } from "@/lib/share";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * "Autobot" — drafts stage-aware WhatsApp messages for a lead/deal and guides
 * the agent on the next best step. One tap to send via WhatsApp (signed).
 */
export function MessageAssistant({
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
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [tone, setTone] = useState<Tone>("mesra");
  const { lang, t } = useLanguage();
  const { open: openWhatsApp } = useWhatsApp();
  const ta = t.autobot;

  const ctx: MsgCtx = { customerName, listingTitle, priceText, agent };
  const pack = messagePack(kind, status, ctx, lang, tone);
  const TONES: Tone[] = ["mesra", "formal", "ringkas", "lembut", "urgent"];

  async function copy(i: number, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-500 px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600">
          <Bot className="h-3.5 w-3.5" /> Autobot
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-500" /> {ta.title}
          </DialogTitle>
        </DialogHeader>

        {/* Guidance for this stage */}
        <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-sm text-foreground">
          <span className="font-semibold">💡 {ta.guide} </span>
          {pack.tip}
        </div>

        {/* Tone selector */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            {ta.toneLabel}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((to) => (
              <button
                key={to}
                onClick={() => setTone(to)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  tone === to
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {ta.tone[to]}
              </button>
            ))}
          </div>
        </div>

        {/* Drafted messages (preview before sending) */}
        <div className="max-h-[50vh] space-y-2 overflow-y-auto">
          {pack.items.map((it, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {it.label}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {it.text}
              </p>
              <div className="mt-2.5 flex gap-2">
                <button
                  onClick={() => openWhatsApp({ phone, text: it.text })}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  <MessageCircle className="h-4 w-4" /> {ta.send}
                </button>
                <button
                  onClick={() => copy(i, it.text)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {copied === i ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {ta.copy}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">{ta.foot}</p>
      </DialogContent>
    </Dialog>
  );
}

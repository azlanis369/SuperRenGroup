"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { MessageCircle, Briefcase } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import {
  WA_PREF_KEY,
  buildWaUrl,
  isAndroid,
  launchWa,
  type WaApp,
  type WaPref,
} from "@/lib/whatsapp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OpenArgs = { phone?: string | null; text: string };

const WhatsAppContext = createContext<{ open: (args: OpenArgs) => void }>({
  open: () => {},
});

function readPref(): WaPref {
  if (typeof localStorage === "undefined") return "ask";
  const v = localStorage.getItem(WA_PREF_KEY);
  return v === "regular" || v === "business" || v === "ask" ? v : "ask";
}

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const tw = t.whatsappApp;
  const [pending, setPending] = useState<OpenArgs | null>(null);
  const [remember, setRemember] = useState(true);
  const pendingRef = useRef<OpenArgs | null>(null);

  function open(args: OpenArgs) {
    const pref = readPref();
    if (pref === "regular" || pref === "business") {
      launchWa(buildWaUrl({ phone: args.phone, text: args.text, app: pref }));
      return;
    }
    pendingRef.current = args;
    setPending(args);
  }

  function choose(app: WaApp) {
    const args = pendingRef.current;
    if (remember) {
      try {
        localStorage.setItem(WA_PREF_KEY, app);
      } catch {}
    }
    if (args) launchWa(buildWaUrl({ phone: args.phone, text: args.text, app }));
    setPending(null);
    pendingRef.current = null;
  }

  return (
    <WhatsAppContext.Provider value={{ open }}>
      {children}
      <Dialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tw.chooseTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{tw.chooseDesc}</p>

          <div className="mt-3 space-y-2">
            <button
              onClick={() => choose("regular")}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
                <MessageCircle className="h-5 w-5" />
              </span>
              <span className="font-semibold text-foreground">{tw.regular}</span>
            </button>
            <button
              onClick={() => choose("business")}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-white">
                <Briefcase className="h-5 w-5" />
              </span>
              <span className="font-semibold text-foreground">{tw.business}</span>
            </button>
          </div>

          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            {tw.remember}
          </label>

          {!isAndroid() ? (
            <p className="mt-2 text-xs text-muted-foreground">{tw.iosNote}</p>
          ) : null}
        </DialogContent>
      </Dialog>
    </WhatsAppContext.Provider>
  );
}

export function useWhatsApp() {
  return useContext(WhatsAppContext);
}

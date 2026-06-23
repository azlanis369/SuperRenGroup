"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WA_PREF_KEY, type WaPref } from "@/lib/whatsapp";

export function WhatsAppAppCard() {
  const { t } = useLanguage();
  const tw = t.whatsappApp;
  const [pref, setPref] = useState<WaPref>("ask");

  useEffect(() => {
    const v = localStorage.getItem(WA_PREF_KEY);
    if (v === "regular" || v === "business" || v === "ask") setPref(v);
  }, []);

  function choose(value: WaPref) {
    setPref(value);
    try {
      localStorage.setItem(WA_PREF_KEY, value);
    } catch {}
  }

  const options: { value: WaPref; label: string }[] = [
    { value: "ask", label: tw.ask },
    { value: "regular", label: tw.regular },
    { value: "business", label: tw.business },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          {tw.settingsTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{tw.settingsDesc}</p>
        <div className="flex flex-wrap gap-2">
          {options.map(({ value, label }) => (
            <Button
              key={value}
              variant={pref === value ? "default" : "outline"}
              size="sm"
              onClick={() => choose(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

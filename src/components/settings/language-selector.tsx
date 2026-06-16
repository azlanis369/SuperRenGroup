"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n/translations";

const LANGS: { value: Lang; flag: string }[] = [
  { value: "en", flag: "🇬🇧" },
  { value: "ms", flag: "🇲🇾" },
];

export function LanguageCard() {
  const { lang, setLang, t } = useLanguage();
  const s = t.settings;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {s.language}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{s.languageSubtitle}</p>
        <div className="flex gap-2">
          {LANGS.map(({ value, flag }) => (
            <Button
              key={value}
              variant={lang === value ? "default" : "outline"}
              size="sm"
              onClick={() => setLang(value)}
              className="gap-2"
            >
              <span>{flag}</span>
              {value === "en" ? s.english : s.malay}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

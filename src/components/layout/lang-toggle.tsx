"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";

/** Compact language toggle (BM ⇄ EN). Shows the language you'll switch to. */
export function LangToggle() {
  const { lang, setLang } = useLanguage();
  const router = useRouter();

  function toggle() {
    setLang(lang === "ms" ? "en" : "ms");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      title="Bahasa / Language"
      aria-label="Tukar bahasa / Switch language"
    >
      <span className="text-xs font-bold tracking-tight">
        {lang === "ms" ? "EN" : "BM"}
      </span>
    </Button>
  );
}

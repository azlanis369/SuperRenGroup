"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Media = { id: string; url: string; media_type: "image" | "video"; caption?: string | null };

export function ListingGallery({
  media,
  title,
}: {
  media: Media[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  if (!media.length) return null;
  const current = media[active];

  return (
    <div className="space-y-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:aspect-[16/10]">
        {current.media_type === "video" ? (
          <video src={current.url} controls className="h-full w-full object-cover" />
        ) : (
          <Image
            src={current.url}
            alt={current.caption || title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
          />
        )}
        {media.length > 1 ? (
          <>
            <button
              onClick={() => setActive((a) => (a - 1 + media.length) % media.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition hover:bg-black/70"
              aria-label="Sebelum"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % media.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition hover:bg-black/70"
              aria-label="Seterusnya"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-0.5 text-xs text-white">
              {active + 1} / {media.length}
            </div>
          </>
        ) : null}
      </div>

      {media.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {media.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-muted",
                i === active ? "border-gold" : "border-transparent",
              )}
            >
              {m.media_type === "video" ? (
                <video src={m.url} className="h-full w-full object-cover" />
              ) : (
                <Image src={m.url} alt="" fill sizes="80px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

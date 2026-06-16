"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TagInput({
  value,
  onChange,
  placeholder = "Taip dan tekan Enter",
  max,
  suggestions = [],
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
  suggestions?: string[];
  className?: string;
}) {
  const [draft, setDraft] = useState("");

  function add(tag: string) {
    const t = tag.trim();
    if (!t) return;
    if (value.includes(t)) return;
    if (max && value.length >= max) return;
    onChange([...value, t]);
    setDraft("");
  }

  function remove(tag: string) {
    onChange(value.filter((v) => v !== tag));
  }

  const remainingSuggestions = suggestions.filter((s) => !value.includes(s));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-input bg-card p-2 focus-within:ring-2 focus-within:ring-ring">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Buang ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={max && value.length >= max ? "Had penuh" : placeholder}
          disabled={max ? value.length >= max : false}
          className="flex-1 min-w-[120px] bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>
      {remainingSuggestions.length > 0 && (!max || value.length < max) ? (
        <div className="flex flex-wrap gap-1.5">
          {remainingSuggestions.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-gold hover:text-foreground"
            >
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

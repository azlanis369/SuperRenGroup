"use client";

import { useState } from "react";
import { Send, ClipboardList } from "lucide-react";
import { track } from "@/lib/analytics";

const ROLES = ["Owner", "Buyer", "Tenant", "Agent"] as const;
const GOALS = [
  "Jual rumah",
  "Sewakan unit",
  "Beli rumah",
  "Sewa rumah",
  "Join team",
] as const;
const TIMELINES = ["Segera", "1–3 bulan", "Survey dulu"] as const;

/**
 * Lightweight lead-intent form. No backend needed: it composes a structured
 * WhatsApp message from the selected fields and opens chat with the agent.
 */
export function LeadCaptureForm({
  waNumber,
  firstName,
}: {
  waNumber: string | null;
  firstName: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("Owner");
  const [goal, setGoal] = useState<(typeof GOALS)[number]>("Jual rumah");
  const [area, setArea] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState<(typeof TIMELINES)[number]>("Segera");
  const [note, setNote] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!waNumber) return;
    const lines = [
      `Salam ${firstName}, saya ingin berhubung berkenaan hartanah.`,
      "",
      `• Nama: ${name || "-"}`,
      `• Telefon: ${phone || "-"}`,
      `• Saya ialah: ${role}`,
      `• Tujuan: ${goal}`,
      `• Kawasan: ${area || "-"}`,
      `• Budget / harga sasaran: ${budget || "-"}`,
      `• Timeline: ${timeline}`,
      note ? `• Nota: ${note}` : null,
    ].filter((x) => x !== null);
    track("click_whatsapp_profile", { source: "lead_form", role, goal });
    window.open(
      `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-card p-5 shadow-card"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ClipboardList className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold leading-tight">Semak Keperluan Anda</h2>
          <p className="text-sm text-muted-foreground">
            Isi ringkas — mesej WhatsApp disiapkan automatik untuk {firstName}.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Nama">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama anda"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="Nombor telefon">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="012-345 6789"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="Saya ialah">
          <Select value={role} onChange={setRole} options={ROLES} />
        </Field>
        <Field label="Tujuan">
          <Select value={goal} onChange={setGoal} options={GOALS} />
        </Field>
        <Field label="Kawasan">
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Cth: Ampang, Pandan Indah"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="Budget / harga sasaran">
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Cth: RM 500k / RM 2,000 sebulan"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="Timeline">
          <Select value={timeline} onChange={setTimeline} options={TIMELINES} />
        </Field>
        <Field label="Nota tambahan" full>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Cth: 3 bilik, dekat LRT…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={!waNumber}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 sm:w-auto"
      >
        <Send className="h-4 w-4" /> Hantar Ke WhatsApp
      </button>
    </form>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

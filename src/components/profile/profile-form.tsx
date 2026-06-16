"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Check } from "lucide-react";
import {
  profileSchema,
  type ProfileFormValues,
} from "@/lib/validations/profile";
import { saveProfile } from "@/lib/actions/profile";
import { compressImage, uploadToStorage, validateImage } from "@/lib/upload";
import { SPECIALIZATIONS } from "@/lib/constants";
import type { AgentProfileRow } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { TagInput } from "@/components/tag-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SPEC_LABELS: Record<string, string> = {
  project: "Project",
  subsale: "Subsale",
  rental: "Rental",
  commercial: "Commercial",
  land: "Land",
};

const AREA_SUGGESTIONS = [
  "KLCC",
  "Mont Kiara",
  "Bangsar",
  "Cheras",
  "Petaling Jaya",
  "Shah Alam",
  "Subang Jaya",
  "Puchong",
  "Kajang",
  "Cyberjaya",
];

export function ProfileForm({
  profile,
  defaultEmail,
  mode = "edit",
}: {
  profile: AgentProfileRow | null;
  defaultEmail: string;
  mode?: "onboarding" | "edit";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [photoUrl, setPhotoUrl] = useState(profile?.profile_photo_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      display_name: profile?.display_name ?? "",
      ren_number: profile?.ren_number ?? "",
      agency_name: profile?.agency_name ?? "",
      title: profile?.title ?? "",
      phone: profile?.phone ?? "",
      whatsapp: profile?.whatsapp ?? "",
      email: profile?.email ?? defaultEmail,
      bio: profile?.bio ?? "",
      service_areas: profile?.service_areas ?? [],
      specialization: (profile?.specialization as ProfileFormValues["specialization"]) ?? [],
      facebook_url: profile?.facebook_url ?? "",
      instagram_url: profile?.instagram_url ?? "",
      tiktok_url: profile?.tiktok_url ?? "",
      website_url: profile?.website_url ?? "",
      telegram_username: profile?.telegram_username ?? "",
      is_profile_public: profile?.is_profile_public ?? true,
    },
  });

  const fullName = watch("full_name");

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const invalid = validateImage(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const compressed = await compressImage(file);
      const { url } = await uploadToStorage(compressed, "avatars");
      setPhotoUrl(url);
    } catch {
      setError("Gagal memuat naik foto. Pastikan bucket storage wujud.");
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(values: ProfileFormValues) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await saveProfile({
        ...values,
        // photo handled separately below via direct field
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Persist photo url if changed (separate lightweight update).
      if (photoUrl && photoUrl !== profile?.profile_photo_url) {
        await fetch("/api/profile/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: photoUrl }),
        }).catch(() => {});
      }
      setSaved(true);
      if (mode === "onboarding") {
        router.push("/dashboard");
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  const initials = (fullName || "A")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Photo */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20 border border-border">
            {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gold text-gold-foreground shadow-sm">
            {uploading ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onPhoto}
              disabled={uploading}
            />
          </label>
        </div>
        <div>
          <p className="font-medium">Foto profil</p>
          <p className="text-sm text-muted-foreground">
            Gambar dimampatkan secara automatik sebelum dimuat naik.
          </p>
        </div>
      </div>

      <Section title="Maklumat asas">
        <Field label="Nama penuh" error={errors.full_name?.message} required>
          <Input {...register("full_name")} placeholder="Cth: Azlan Zakaria" />
        </Field>
        <Field label="Nama paparan" error={errors.display_name?.message}>
          <Input {...register("display_name")} placeholder="Cth: Azlan Z." />
        </Field>
        <Field label="Nombor REN" error={errors.ren_number?.message}>
          <Input {...register("ren_number")} placeholder="REN 12345" />
        </Field>
        <Field label="Nama agensi" error={errors.agency_name?.message}>
          <Input {...register("agency_name")} placeholder="Super Ren Realty" />
        </Field>
        <Field label="Jawatan" error={errors.title?.message}>
          <Input {...register("title")} placeholder="Senior Negotiator" />
        </Field>
      </Section>

      <Section title="Hubungi">
        <Field label="Nombor telefon" error={errors.phone?.message} required>
          <Input {...register("phone")} placeholder="012-345 6789" inputMode="tel" />
        </Field>
        <Field label="WhatsApp" error={errors.whatsapp?.message} required>
          <Input {...register("whatsapp")} placeholder="012-345 6789" inputMode="tel" />
        </Field>
        <Field label="Emel" error={errors.email?.message} required>
          <Input {...register("email")} type="email" />
        </Field>
        <Field label="Telegram username" error={errors.telegram_username?.message}>
          <Input {...register("telegram_username")} placeholder="@username" />
        </Field>
      </Section>

      <Section title="Kepakaran & kawasan">
        <Field label="Kawasan servis" error={errors.service_areas?.message} full>
          <Controller
            control={control}
            name="service_areas"
            render={({ field }) => (
              <TagInput
                value={field.value ?? []}
                onChange={field.onChange}
                suggestions={AREA_SUGGESTIONS}
                placeholder="Tambah kawasan…"
              />
            )}
          />
        </Field>
        <Field label="Pengkhususan" full>
          <Controller
            control={control}
            name="specialization"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map((spec) => {
                  const active = field.value?.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() =>
                        field.onChange(
                          active
                            ? field.value.filter((s) => s !== spec)
                            : [...(field.value ?? []), spec],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-gold",
                      )}
                    >
                      {SPEC_LABELS[spec]}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </Field>
        <Field label="Bio ringkas" error={errors.bio?.message} full>
          <Textarea
            {...register("bio")}
            rows={3}
            placeholder="Cerita ringkas tentang anda sebagai negotiator…"
          />
        </Field>
      </Section>

      <Section title="Media sosial">
        <Field label="Facebook" error={errors.facebook_url?.message}>
          <Input {...register("facebook_url")} placeholder="https://facebook.com/…" />
        </Field>
        <Field label="Instagram" error={errors.instagram_url?.message}>
          <Input {...register("instagram_url")} placeholder="https://instagram.com/…" />
        </Field>
        <Field label="TikTok" error={errors.tiktok_url?.message}>
          <Input {...register("tiktok_url")} placeholder="https://tiktok.com/@…" />
        </Field>
        <Field label="Laman web" error={errors.website_url?.message}>
          <Input {...register("website_url")} placeholder="https://…" />
        </Field>
      </Section>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <p className="font-medium">Profil awam</p>
          <p className="text-sm text-muted-foreground">
            Benarkan profil anda dilihat sebagai kad bisnes digital.
          </p>
        </div>
        <Controller
          control={control}
          name="is_profile_public"
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-16 z-10 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:bottom-0">
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto"
          disabled={isPending || uploading}
        >
          {isPending ? <Spinner /> : saved ? <Check className="h-4 w-4" /> : null}
          {mode === "onboarding" ? "Simpan & teruskan" : "Simpan perubahan"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  error,
  required,
  full,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
      <Label>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

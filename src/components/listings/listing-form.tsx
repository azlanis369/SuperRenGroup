"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { listingSchema, type ListingFormValues } from "@/lib/validations/listing";
import { createListing, updateListing } from "@/lib/actions/listing";
import {
  LISTING_CATEGORIES,
  CATEGORY_LABELS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  TENURES,
  TENURE_LABELS,
  FURNISHINGS,
  FURNISHING_LABELS,
  VISIBILITIES,
  VISIBILITY_LABELS,
  type ListingCategory,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";
import { TagInput } from "@/components/tag-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaUploader, type MediaItem } from "@/components/listings/media-uploader";

const STEPS = [
  "Asas",
  "Butiran Kategori",
  "Ciri & Jualan",
  "Media",
  "Terbitan",
] as const;

type Props = {
  mode: "create" | "edit";
  listingId?: string;
  defaults?: Partial<ListingFormValues>;
  initialMedia?: MediaItem[];
};

export function ListingForm({ mode, listingId, defaults, initialMedia = [] }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      category: "subsale",
      title: "",
      property_type: "condo",
      area: "",
      show_exact_address: false,
      top_selling_points: [],
      facilities: [],
      amenities: [],
      nearby: [],
      tags: [],
      status: "draft",
      visibility: "private",
      show_agent_phone: true,
      enable_whatsapp_cta: true,
      enable_telegram_share: true,
      featured: false,
      ...defaults,
    },
  });

  const category = form.watch("category");

  async function next() {
    // Validate only step-1 critical fields before advancing.
    if (step === 0) {
      const valid = await form.trigger(["category", "title", "property_type", "area"]);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function submit(values: ListingFormValues) {
    setError(null);
    const cleanMedia = media
      .filter((m) => !m.uploading)
      .map((m) => ({
        url: m.url,
        media_type: m.media_type,
        caption: m.caption ?? null,
        file_size: m.file_size ?? null,
      }));

    startTransition(async () => {
      const res =
        mode === "create"
          ? await createListing(values, cleanMedia)
          : await updateListing(listingId!, values, cleanMedia);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/listings/${res.id}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => i < step && setStep(i)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              i === step
                ? "bg-primary text-primary-foreground"
                : i < step
                  ? "bg-gold/15 text-gold-foreground"
                  : "bg-muted text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                i === step
                  ? "bg-primary-foreground/20"
                  : i < step
                    ? "bg-gold text-gold-foreground"
                    : "bg-background",
              )}
            >
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(submit)}>
        <Card className="p-4 sm:p-6">
          {step === 0 && <StepBasic form={form} />}
          {step === 1 && <StepCategory form={form} category={category} />}
          {step === 2 && <StepFeatures form={form} />}
          {step === 3 && <MediaUploader value={media} onChange={setMedia} />}
          {step === 4 && <StepPublish form={form} />}
        </Card>

        {error ? (
          <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
          >
            <ChevronLeft className="h-4 w-4" /> Kembali
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Seterusnya <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner /> : <Check className="h-4 w-4" />}
              {mode === "create" ? "Cipta Listing" : "Simpan"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

type FormType = UseFormReturn<ListingFormValues>;

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  error,
  required,
  full,
  hint,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  full?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
      <Label>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function NumberField({
  form,
  name,
  label,
  placeholder,
}: {
  form: FormType;
  name: keyof ListingFormValues;
  label: string;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        inputMode="numeric"
        placeholder={placeholder}
        {...form.register(name as never)}
      />
    </Field>
  );
}

function SwitchRow({
  form,
  name,
  label,
  desc,
}: {
  form: FormType;
  name: keyof ListingFormValues;
  label: string;
  desc?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div className="pr-3">
        <p className="text-sm font-medium">{label}</p>
        {desc ? <p className="text-xs text-muted-foreground">{desc}</p> : null}
      </div>
      <Controller
        control={form.control}
        name={name as never}
        render={({ field }) => (
          <Switch
            checked={Boolean(field.value)}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </div>
  );
}

function StepBasic({ form }: { form: FormType }) {
  const { register, control, formState } = form;
  const e = formState.errors;
  return (
    <div className="space-y-5">
      <Field label="Kategori listing" required error={e.category?.message} full>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2">
              {LISTING_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => field.onChange(c)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                    field.value === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-gold",
                  )}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          )}
        />
      </Field>
      <Grid>
        <Field label="Tajuk hartanah" required error={e.title?.message} full>
          <Input
            placeholder="Cth: Condo Mewah 3 Bilik, Mont Kiara"
            {...register("title")}
          />
        </Field>
        <Field label="Jenis hartanah" required>
          <Controller
            control={control}
            name="property_type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {PROPERTY_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Kawasan" required error={e.area?.message}>
          <Input placeholder="Cth: Mont Kiara" {...register("area")} />
        </Field>
        <Field label="Harga (RM)">
          <Input type="number" inputMode="numeric" {...register("price")} />
        </Field>
        <Field label="Teks harga (pilihan)" hint="Cth: 'Dari RM450k' atau 'Nego'">
          <Input {...register("price_display")} />
        </Field>
        <Field label="Tenure">
          <Controller
            control={control}
            name="tenure"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tenure" />
                </SelectTrigger>
                <SelectContent>
                  {TENURES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TENURE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Furnishing">
          <Controller
            control={control}
            name="furnishing"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  {FURNISHINGS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {FURNISHING_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <NumberField form={form} name="bedrooms" label="Bilik tidur" />
        <NumberField form={form} name="bathrooms" label="Bilik air" />
        <NumberField form={form} name="carparks" label="Tempat letak kereta" />
        <NumberField form={form} name="built_up_sqft" label="Built-up (sqft)" />
        <NumberField form={form} name="land_area_sqft" label="Keluasan tanah (sqft)" />
      </Grid>
      <Grid>
        <Field label="Alamat penuh (peribadi)" hint="Tidak dipaparkan secara awam melainkan dibenarkan" full>
          <Textarea rows={2} {...register("address_private")} />
        </Field>
        <Field label="Alamat paparan awam" full>
          <Input placeholder="Cth: Berhampiran MRT Mont Kiara" {...register("address_public")} />
        </Field>
        <Field label="Pautan peta (Google Maps)" full>
          <Input placeholder="https://maps.google.com/…" {...register("map_url")} />
        </Field>
      </Grid>
    </div>
  );
}

function StepCategory({
  form,
  category,
}: {
  form: FormType;
  category: ListingCategory;
}) {
  const { register, control } = form;
  if (category === "project") {
    return (
      <Grid>
        <Field label="Nama projek"><Input {...register("project.project_name")} /></Field>
        <Field label="Pemaju"><Input {...register("project.developer")} /></Field>
        <Field label="Tahun siap / dijangka siap"><Input {...register("project.completion_year")} /></Field>
        <Field label="Status projek" hint="New Launch / Under Construction / Completed">
          <Input {...register("project.project_status")} />
        </Field>
        <Field label="Jenis unit"><Input {...register("project.unit_types")} /></Field>
        <Field label="Harga permulaan (RM)"><Input type="number" {...register("project.starting_price")} /></Field>
        <Field label="Yuran penyelenggaraan"><Input type="number" {...register("project.maintenance_fee")} /></Field>
        <Field label="Booking fee (RM)"><Input type="number" {...register("project.booking_fee")} /></Field>
        <Field label="Pakej / rebat" full><Textarea rows={2} {...register("project.package_info")} /></Field>
        <Field label="Pautan sales gallery"><Input {...register("project.sales_gallery_link")} /></Field>
        <Field label="Pautan brochure"><Input {...register("project.brochure_url")} /></Field>
      </Grid>
    );
  }
  if (category === "subsale") {
    return (
      <Grid>
        <Field label="Harga jualan (asking)"><Input type="number" {...register("subsale.asking_price")} /></Field>
        <Field label="Anggaran valuation"><Input type="number" {...register("subsale.valuation_estimate")} /></Field>
        <Field label="Status penghunian" hint="Owner occupied / Tenanted / Vacant">
          <Input {...register("subsale.occupancy_status")} />
        </Field>
        <Field label="Yuran penyelenggaraan"><Input type="number" {...register("subsale.maintenance_fee")} /></Field>
        <Field label="Arah hadapan"><Input {...register("subsale.facing_direction")} /></Field>
        <Field label="Jenis hakmilik"><Input {...register("subsale.title_type")} /></Field>
        <Field label="Maklumat renovasi" full><Textarea rows={2} {...register("subsale.renovation_info")} /></Field>
        <Field label="Ketersediaan viewing"><Input {...register("subsale.viewing_availability")} /></Field>
        <Field label="Nota komisen (peribadi)" hint="Hanya anda & admin nampak" full>
          <Textarea rows={2} {...register("subsale.private_commission_notes")} />
        </Field>
        <SwitchRowNested form={form} name="subsale.co_broke_allowed" label="Co-broke dibenarkan" />
      </Grid>
    );
  }
  return (
    <Grid>
      <Field label="Sewa bulanan (RM)"><Input type="number" {...register("rental.monthly_rental")} /></Field>
      <Field label="Deposit"><Input {...register("rental.deposit_requirement")} /></Field>
      <Field label="Tempoh sewa minimum"><Input {...register("rental.minimum_tenancy")} /></Field>
      <Field label="Tarikh boleh masuk"><Input type="date" {...register("rental.move_in_date")} /></Field>
      <Field label="Keutamaan penyewa"><Input {...register("rental.tenant_preference")} /></Field>
      <Field label="Maklumat utiliti" full><Textarea rows={2} {...register("rental.utilities_info")} /></Field>
      <SwitchRowNested form={form} name="rental.pet_allowed" label="Haiwan peliharaan dibenarkan" />
      <SwitchRowNested form={form} name="rental.cooking_allowed" label="Memasak dibenarkan" />
      <SwitchRowNested form={form} name="rental.parking_included" label="Parking disertakan" />
    </Grid>
  );
}

function SwitchRowNested({
  form,
  name,
  label,
}: {
  form: FormType;
  name: string;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <p className="text-sm font-medium">{label}</p>
      <Controller
        control={form.control}
        name={name as never}
        render={({ field }) => (
          <Switch
            checked={Boolean(field.value)}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </div>
  );
}

function StepFeatures({ form }: { form: FormType }) {
  const { control, register } = form;
  return (
    <div className="space-y-5">
      <Field label="Top 5 selling points" hint="Tekan Enter untuk tambah (maks 5)" full>
        <Controller
          control={control}
          name="top_selling_points"
          render={({ field }) => (
            <TagInput value={field.value ?? []} onChange={field.onChange} max={5} placeholder="Cth: Berhampiran MRT" />
          )}
        />
      </Field>
      <Field label="Kemudahan (facilities)" full>
        <Controller
          control={control}
          name="facilities"
          render={({ field }) => (
            <TagInput
              value={field.value ?? []}
              onChange={field.onChange}
              suggestions={["Swimming Pool", "Gym", "24h Security", "Playground", "Surau", "BBQ Area"]}
            />
          )}
        />
      </Field>
      <Field label="Kemudahan sekitar (amenities)" full>
        <Controller
          control={control}
          name="amenities"
          render={({ field }) => (
            <TagInput
              value={field.value ?? []}
              onChange={field.onChange}
              suggestions={["Shopping Mall", "School", "Hospital", "Bank", "Restoran"]}
            />
          )}
        />
      </Field>
      <Field label="Berhampiran (MRT/LRT, mall, sekolah)" full>
        <Controller
          control={control}
          name="nearby"
          render={({ field }) => (
            <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Cth: MRT Mont Kiara 5 min" />
          )}
        />
      </Field>
      <Field label="Tags" full>
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Cth: hot, urgent, value-buy" />
          )}
        />
      </Field>
      <Field label="Deskripsi listing" full>
        <Textarea rows={5} placeholder="Huraikan hartanah ini…" {...register("description")} />
      </Field>
      <Field label="Nota dalaman (peribadi)" hint="Tidak dipaparkan secara awam" full>
        <Textarea rows={2} {...register("internal_notes")} />
      </Field>
    </div>
  );
}

function StepPublish({ form }: { form: FormType }) {
  const { control } = form;
  return (
    <div className="space-y-5">
      <Grid>
        <Field label="Status" full>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <div className="flex gap-2">
                {(["draft", "available"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => field.onChange(s)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition-colors",
                      field.value === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-gold",
                    )}
                  >
                    {s === "draft" ? "Draft" : "Available (terbit)"}
                  </button>
                ))}
              </div>
            )}
          />
        </Field>
        <Field label="Keterlihatan (visibility)" full>
          <Controller
            control={control}
            name="visibility"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITIES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {VISIBILITY_LABELS[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </Grid>
      <div className="space-y-2">
        <SwitchRow form={form} name="show_exact_address" label="Tunjuk alamat tepat" desc="Paparkan alamat penuh di halaman awam" />
        <SwitchRow form={form} name="show_agent_phone" label="Tunjuk nombor telefon agent" />
        <SwitchRow form={form} name="enable_whatsapp_cta" label="Aktifkan WhatsApp CTA" />
        <SwitchRow form={form} name="enable_telegram_share" label="Aktifkan share Telegram" />
        <SwitchRow form={form} name="featured" label="Featured listing" desc="Paparkan di bahagian unggulan profil anda" />
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Check } from "lucide-react";
import { leadSchema, type LeadFormValues } from "@/lib/validations/lead";
import { createLead } from "@/lib/actions/lead";
import { LEAD_SOURCES } from "@/lib/constants";
import { LEAD_SOURCE_LABELS } from "@/components/leads/lead-status";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewLeadButton({
  listings = [],
}: {
  listings?: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      source: "manual",
      budget: "",
      preferred_area: "",
      notes: "",
      listing_id: "",
    },
  });

  function onSubmit(values: LeadFormValues) {
    setError(null);
    startTransition(async () => {
      const res = await createLead(values);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4" /> Lead Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lead Baru</DialogTitle>
          <DialogDescription>
            Rekod prospek baru secara manual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama" error={errors.name?.message} required>
              <Input {...register("name")} placeholder="Cth: Ahmad Kassim" />
            </Field>
            <Field label="Telefon" error={errors.phone?.message} required>
              <Input {...register("phone")} placeholder="012-345 6789" inputMode="tel" />
            </Field>
            <Field label="Emel" error={errors.email?.message}>
              <Input {...register("email")} type="email" placeholder="emel@contoh.com" />
            </Field>
            <Field label="Sumber" error={errors.source?.message}>
              <Controller
                control={control}
                name="source"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih sumber" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {LEAD_SOURCE_LABELS[s] ?? s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Bajet" error={errors.budget?.message}>
              <Input {...register("budget")} placeholder="Cth: RM 500k - 600k" />
            </Field>
            <Field label="Kawasan pilihan" error={errors.preferred_area?.message}>
              <Input {...register("preferred_area")} placeholder="Cth: Cheras" />
            </Field>
            {listings.length ? (
              <Field label="Listing berkaitan" full>
                <Controller
                  control={control}
                  name="listing_id"
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tiada / pilih listing" />
                      </SelectTrigger>
                      <SelectContent>
                        {listings.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            ) : null}
            <Field label="Nota" error={errors.notes?.message} full>
              <Textarea {...register("notes")} rows={3} placeholder="Nota tambahan…" />
            </Field>
          </div>

          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Spinner /> : <Check className="h-4 w-4" />}
            Simpan Lead
          </Button>
        </form>
      </DialogContent>
    </Dialog>
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

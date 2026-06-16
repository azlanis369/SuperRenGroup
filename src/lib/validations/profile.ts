import { z } from "zod";
import { SPECIALIZATIONS } from "@/lib/constants";

const optionalUrl = z
  .string()
  .trim()
  .url("URL tidak sah")
  .or(z.literal(""))
  .optional();

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Nama penuh diperlukan").max(120),
  display_name: z.string().trim().max(80).optional().or(z.literal("")),
  ren_number: z.string().trim().max(40).optional().or(z.literal("")),
  agency_name: z.string().trim().max(120).optional().or(z.literal("")),
  title: z.string().trim().max(80).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(7, "Nombor telefon tidak sah")
    .max(20)
    .regex(/^[0-9+\-\s]+$/, "Nombor telefon tidak sah"),
  whatsapp: z
    .string()
    .trim()
    .min(7, "Nombor WhatsApp tidak sah")
    .max(20)
    .regex(/^[0-9+\-\s]+$/, "Nombor WhatsApp tidak sah"),
  email: z.string().trim().email("Emel tidak sah").max(160),
  bio: z.string().trim().max(600, "Maksimum 600 aksara").optional().or(z.literal("")),
  service_areas: z.array(z.string().trim().min(1)).max(20).default([]),
  specialization: z.array(z.enum(SPECIALIZATIONS)).max(5).default([]),
  facebook_url: optionalUrl,
  instagram_url: optionalUrl,
  tiktok_url: optionalUrl,
  website_url: optionalUrl,
  telegram_username: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal("")),
  is_profile_public: z.boolean().default(true),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

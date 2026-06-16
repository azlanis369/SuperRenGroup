import { z } from "zod";
import { LEAD_SOURCES } from "@/lib/constants";

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Nama diperlukan").max(120),
  phone: z
    .string()
    .trim()
    .min(7, "Nombor telefon tidak sah")
    .max(20)
    .regex(/^[0-9+\-\s]+$/, "Nombor telefon tidak sah"),
  email: z.string().trim().email("Emel tidak sah").max(160).optional().or(z.literal("")),
  source: z.enum(LEAD_SOURCES),
  budget: z.string().trim().max(80).optional().or(z.literal("")),
  preferred_area: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(600, "Maksimum 600 aksara").optional().or(z.literal("")),
  listing_id: z.string().trim().optional().or(z.literal("")),
});

export type LeadFormValues = z.infer<typeof leadSchema>;

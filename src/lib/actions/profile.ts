"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validations/profile";
import { slugify, uniqueSlug } from "@/lib/utils";
import { LOCAL_DEMO } from "@/lib/demo-mode";
import { demoAgents } from "@/lib/demo-data/dataset";

export type ActionResult =
  | { ok: true; slug?: string }
  | { ok: false; error: string };

/** Create or update the current user's agent profile. */
export async function saveProfile(input: unknown): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Tidak dibenarkan." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Data tidak sah.",
    };
  }
  const data = parsed.data;

  if (LOCAL_DEMO) {
    // Persist edits onto the in-memory agent profile (dev session only).
    const idx = demoAgents.findIndex((a) => a.user_id === user.id);
    if (idx >= 0) {
      demoAgents[idx] = {
        ...demoAgents[idx],
        full_name: data.full_name,
        display_name: data.display_name || null,
        ren_number: data.ren_number || null,
        agency_name: data.agency_name || null,
        title: data.title || null,
        phone: data.phone,
        whatsapp: data.whatsapp,
        email: data.email,
        bio: data.bio || null,
        service_areas: data.service_areas,
        specialization: data.specialization,
        is_profile_public: data.is_profile_public,
        updated_at: new Date().toISOString(),
      };
    }
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { ok: true, slug: demoAgents[idx]?.slug };
  }

  const supabase = await createClient();

  // Determine slug: keep existing, else derive a unique one from the name.
  let slug = user.profile?.slug;
  if (!slug || slug.startsWith("agent-")) {
    const base = slugify(data.display_name || data.full_name);
    // Try the clean slug first; fall back to a unique suffix on collision.
    const { data: existing } = await supabase
      .from("agent_profiles")
      .select("id")
      .eq("slug", base)
      .neq("user_id", user.id)
      .maybeSingle();
    slug = existing || !base ? uniqueSlug(data.full_name) : base;
  }

  const payload = {
    user_id: user.id,
    full_name: data.full_name,
    display_name: data.display_name || null,
    slug,
    ren_number: data.ren_number || null,
    agency_name: data.agency_name || null,
    title: data.title || null,
    phone: data.phone,
    whatsapp: data.whatsapp,
    email: data.email,
    bio: data.bio || null,
    service_areas: data.service_areas,
    specialization: data.specialization,
    facebook_url: data.facebook_url || null,
    instagram_url: data.instagram_url || null,
    tiktok_url: data.tiktok_url || null,
    website_url: data.website_url || null,
    telegram_username: data.telegram_username || null,
    is_profile_public: data.is_profile_public,
  };

  const { error } = await supabase
    .from("agent_profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    return { ok: false, error: "Gagal menyimpan profil. Cuba lagi." };
  }

  // Activate the user once they complete onboarding.
  if (user.status === "pending") {
    await supabase.from("users").update({ status: "active" }).eq("id", user.id);
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true, slug };
}

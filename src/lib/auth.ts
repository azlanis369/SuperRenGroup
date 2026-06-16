import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLES, type Role } from "@/lib/constants";
import type { AgentProfileRow, UserRow } from "@/lib/database.types";
import { LOCAL_DEMO, DEMO_ROLE_COOKIE } from "@/lib/demo-mode";
import { demoUsers, demoAgents } from "@/lib/demo-data/dataset";

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  status: UserRow["status"];
  profile: AgentProfileRow | null;
};

const NOW = new Date().toISOString();

/** Synthetic profile for admin personas (no agent_profiles row in demo data). */
function adminProfile(user: UserRow): AgentProfileRow {
  const isSuper = user.role === ROLES.SUPER_ADMIN;
  return {
    id: `profile-${user.id}`,
    user_id: user.id,
    full_name: isSuper ? "Super Admin" : "Group Admin",
    display_name: isSuper ? "Super Admin" : "Group Admin",
    slug: isSuper ? "super-admin" : "group-admin",
    profile_photo_url: null,
    ren_number: null,
    agency_name: "Super Ren Realty Demo",
    title: isSuper ? "Super Admin" : "Team Leader",
    phone: "+60 12-000 0000",
    whatsapp: "+60120000000",
    email: user.email,
    bio: "Akaun pentadbir demo.",
    service_areas: [],
    specialization: [],
    facebook_url: null,
    instagram_url: null,
    tiktok_url: null,
    website_url: null,
    telegram_username: null,
    qr_code_url: null,
    is_profile_public: false,
    is_demo: true,
    created_at: NOW,
    updated_at: NOW,
  };
}

/** Resolve the demo persona from the role cookie (defaults to admin). */
async function demoSessionUser(): Promise<SessionUser> {
  const cookieStore = await cookies();
  const want = cookieStore.get(DEMO_ROLE_COOKIE)?.value;
  const user =
    demoUsers.find((u) => u.id === want) ??
    (want === "agent"
      ? demoUsers.find((u) => u.role === ROLES.AGENT)!
      : demoUsers.find((u) => u.id === "user-admin")!);
  const profile =
    demoAgents.find((a) => a.user_id === user.id) ?? adminProfile(user);
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: "active",
    profile,
  };
}

/**
 * Resolve the current authenticated user with their app role and profile.
 * Cached per-request. Returns null when not signed in.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (LOCAL_DEMO) return demoSessionUser();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: appUser } = await supabase
    .from("users")
    .select("id, email, role, status")
    .eq("id", user.id)
    .single();

  const { data: profile } = await supabase
    .from("agent_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: appUser?.email ?? user.email ?? "",
    role: (appUser?.role as Role) ?? ROLES.AGENT,
    status: appUser?.status ?? "pending",
    profile: profile ?? null,
  };
});

/** Require a signed-in user; redirect to login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.status === "deactivated") redirect("/login?error=deactivated");
  return user;
}

/** Require a signed-in user who has completed onboarding. */
export async function requireOnboardedUser(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.profile || !user.profile.full_name) redirect("/onboarding");
  return user;
}

/** Require one of the given roles, otherwise redirect to dashboard. */
export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export function isAdmin(role: Role): boolean {
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}

export function isSuperAdmin(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

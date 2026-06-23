import { NextResponse } from "next/server";
import { LOCAL_DEMO, DEMO_ROLE_COOKIE } from "@/lib/demo-mode";
import { demoUsers } from "@/lib/demo-data/dataset";

/**
 * Shareable demo deep-links that open the app directly as a given persona.
 * e.g. /enter/group-manager  -> Group Manager landing on /admin
 *      /enter/amirul         -> Amirul Nasyriq (agent) landing on /dashboard
 *      /enter/team-leader    -> Amirul Nasyriq landing on /team
 */
const ENTRY: Record<string, { role: string; to: string }> = {
  // Amirul Nasyriq = Group Team Manager (the primary persona).
  "group-manager": { role: "user-azlan", to: "/admin" },
  gm: { role: "user-azlan", to: "/admin" },
  amirul: { role: "user-azlan", to: "/admin" },
  azlan: { role: "user-azlan", to: "/dashboard" },
  "team-leader": { role: "user-azlan", to: "/team" },
  admin: { role: "user-admin", to: "/admin" },
  "super-admin": { role: "user-superadmin", to: "/admin" },
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ role: string }> },
) {
  const { role } = await params;
  const key = decodeURIComponent(role).toLowerCase();
  const entry =
    ENTRY[key] ??
    (demoUsers.some((u) => u.id === role)
      ? { role, to: "/dashboard" }
      : { role: "user-azlan", to: "/dashboard" });

  const res = NextResponse.redirect(new URL(entry.to, req.url));
  if (LOCAL_DEMO) {
    res.cookies.set(DEMO_ROLE_COOKIE, entry.role, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }
  return res;
}

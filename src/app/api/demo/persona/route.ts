import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LOCAL_DEMO, DEMO_ROLE_COOKIE } from "@/lib/demo-mode";

const ALLOWED = new Set([
  "user-superadmin",
  "user-admin",
  "user-aiman",
  "user-aisyah",
  "user-daniel",
  "user-siti",
  "user-faris",
  "user-michelle",
  "user-harith",
  "user-kavitha",
  "agent",
]);

/** Switch the active demo persona (local demo only). */
export async function POST(request: Request) {
  if (!LOCAL_DEMO) {
    return NextResponse.json({ error: "Not in demo" }, { status: 400 });
  }
  let role: unknown;
  try {
    ({ role } = await request.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (typeof role !== "string" || !ALLOWED.has(role)) {
    return NextResponse.json({ error: "Invalid persona" }, { status: 400 });
  }
  const store = await cookies();
  store.set(DEMO_ROLE_COOKIE, role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  return NextResponse.json({ ok: true });
}

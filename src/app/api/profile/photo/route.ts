import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Persist the current user's profile photo URL (uploaded client-side). */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let url: unknown;
  try {
    ({ url } = await request.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (typeof url !== "string" || !url.startsWith("http")) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const { error } = await supabase
    .from("agent_profiles")
    .update({ profile_photo_url: url })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

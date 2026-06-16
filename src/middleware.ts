import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { LOCAL_DEMO } from "@/lib/demo-mode";

export async function middleware(request: NextRequest) {
  // Zero-config local demo has no auth backend — let every request through.
  if (LOCAL_DEMO) return NextResponse.next();
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image
     * - favicon and common static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

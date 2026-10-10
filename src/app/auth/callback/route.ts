import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeAuthRedirect } from "@/lib/auth/redirect";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeAuthRedirect(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?error=oauth", request.url));
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}

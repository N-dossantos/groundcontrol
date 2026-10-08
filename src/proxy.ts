import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Único origen autorizado a llamar /api/** desde el navegador: la propia app.
// Las rutas server-to-server (cron con CRON_SECRET, webhook de Mercado Pago
// con firma propia) no mandan header Origin, así que esto no las afecta.
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter((origin): origin is string => Boolean(origin));

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");

  if (pathname.startsWith("/api")) {
    // Sin header Origin (curl, otro server, cron, webhook) no es una petición
    // cross-origin de navegador: CORS no aplica, se deja pasar.
    const isForeignBrowserOrigin = origin !== null && !ALLOWED_ORIGINS.includes(origin);

    if (request.method === "OPTIONS") {
      if (isForeignBrowserOrigin) {
        return new NextResponse(null, { status: 403 });
      }
      return new NextResponse(null, {
        status: 204,
        headers: origin ? corsHeaders(origin) : undefined,
      });
    }

    if (isForeignBrowserOrigin) {
      return NextResponse.json({ error: "origen_no_permitido" }, { status: 403 });
    }
  }

  const { response, user, supabase } = await updateSession(request);

  const requiresAuth = pathname.startsWith("/cuenta") || pathname.startsWith("/admin");

  if (requiresAuth && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.startsWith("/api") && origin) {
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      response.headers.set(key, value);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

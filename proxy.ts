import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./src/lib/supabase/proxy";

const protectedRoutes = ["/dashboard", "/calendar", "/repertoire", "/settings", "/profile", "/onboarding", "/community", "/inbox", "/help"];
const authRoutes = ["/login", "/signup", "/check-email"];

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Check if the user is authenticated by looking for the Supabase session cookie
  const hasSession = request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-") && cookie.value.length > 0);

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authRoutes.some((route) => pathname.startsWith(route)) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
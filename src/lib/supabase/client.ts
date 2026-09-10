import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.");
  }

  const rememberMe = typeof window === "undefined" || window.localStorage.getItem("coda-remember-me") !== "false";
  return createBrowserClient(url, key, {
    auth: { persistSession: true, storage: rememberMe ? window.localStorage : window.sessionStorage },
  });
}

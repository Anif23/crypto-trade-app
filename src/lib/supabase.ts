import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  throw new Error("Missing Supabase env vars. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.");
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

export const EDGE_URL = `${url}/functions/v1/market-data`;

export async function callEdge(params: Record<string, string>): Promise<Response> {
  const url = new URL(EDGE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
  });
}

// CryptoTrade market-data edge function.
// Proxies CoinGecko public API with DB-backed caching and graceful fallbacks.
// Routes:
//   GET /market-data?action=list                      -> all supported assets (live)
//   GET /market-data?action=detail&asset=<uuid>       -> single asset live detail
//   GET /market-data?action=history&asset=<uuid>&interval=1H|4H|1D|1W|1M|1Y
//
// Caching: prices are cached in `crypto_assets` (refreshed if older than 60s); historical
// candles are cached in `price_history` and refreshed if older than the interval's TTL.
// All responses carry the mandatory CORS headers.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CG = "https://api.coingecko.com/api/v3";
const FRESH_MS = 60_000; // refresh live prices if older than 60s

const INTERVAL_CONFIG: Record<string, { ttlMin: number; days: string }> = {
  "1H": { ttlMin: 5, days: "0.04" },     // ~1h, 5min candles via market_chart
  "4H": { ttlMin: 15, days: "0.17" },    // ~4h
  "1D": { ttlMin: 30, days: "1" },
  "1W": { ttlMin: 120, days: "7" },
  "1M": { ttlMin: 360, days: "30" },
  "1Y": { ttlMin: 1440, days: "365" },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function supabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("missing supabase env");
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "list";
    const supa = supabaseAdmin();

    if (action === "list") {
      return await handleList(supa);
    }
    if (action === "detail") {
      const assetId = url.searchParams.get("asset");
      if (!assetId) return json({ error: "missing asset" }, 400);
      return await handleDetail(supa, assetId);
    }
    if (action === "history") {
      const assetId = url.searchParams.get("asset");
      const interval = (url.searchParams.get("interval") ?? "1D") as keyof typeof INTERVAL_CONFIG;
      if (!assetId) return json({ error: "missing asset" }, 400);
      if (!INTERVAL_CONFIG[interval]) return json({ error: "invalid interval" }, 400);
      return await handleHistory(supa, assetId, interval);
    }
    return json({ error: "unknown action" }, 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "internal_error";
    return json({ error: "market_data_failed", detail: msg }, 500);
  }
}

// ---------- helpers ----------

async function fetchWithTimeout(resource: string, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(resource, {
      signal: ctrl.signal,
      headers: { accept: "application/json" },
    });
  } finally {
    clearTimeout(id);
  }
}

async function refreshLivePrices(supa: ReturnType<typeof supabaseAdmin>): Promise<void> {
  // only refresh if the newest row is older than FRESH_MS
  const { data: newest } = await supa
    .from("crypto_assets")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (newest && Date.now() - new Date(newest.updated_at).getTime() < FRESH_MS) {
    return;
  }

  const { data: assets } = await supa
    .from("crypto_assets")
    .select("id,coingecko_id")
    .order("rank", { ascending: true })
    .limit(50);

  if (!assets || assets.length === 0) return;
  const ids = assets.map((a) => a.coingecko_id).join(",");

  let resp: Response | null = null;
  try {
    resp = await fetchWithTimeout(
      `${CG}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`
    );
  } catch {
    // network/rate-limit/timeout — keep cached values, caller serves stale data
    return;
  }
  if (!resp || !resp.ok) return;

  const markets = await resp.json();
  if (!Array.isArray(markets)) return;

  for (const m of markets) {
    await supa
      .from("crypto_assets")
      .update({
        current_price: m.current_price ?? 0,
        market_cap: m.market_cap ?? 0,
        total_volume: m.total_volume ?? 0,
        price_change_percentage_24h: m.price_change_percentage_24h ?? 0,
        high_24h: m.high_24h ?? 0,
        low_24h: m.low_24h ?? 0,
        rank: m.market_cap_rank ?? null,
        image_url: m.image ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("coingecko_id", m.id);
  }
}

async function handleList(supa: ReturnType<typeof supabaseAdmin>): Promise<Response> {
  await refreshLivePrices(supa);
  const { data, error } = await supa
    .from("crypto_assets")
    .select("*")
    .order("rank", { ascending: true, nullsFirst: false });
  if (error) return json({ error: "db_error", detail: error.message }, 500);
  return json({ assets: data });
}

async function handleDetail(supa: ReturnType<typeof supabaseAdmin>, assetId: string): Promise<Response> {
  await refreshLivePrices(supa);
  const { data, error } = await supa
    .from("crypto_assets")
    .select("*")
    .eq("id", assetId)
    .maybeSingle();
  if (error) return json({ error: "db_error", detail: error.message }, 500);
  if (!data) return json({ error: "asset_not_found" }, 404);
  return json({ asset: data });
}

async function handleHistory(
  supa: ReturnType<typeof supabaseAdmin>,
  assetId: string,
  interval: keyof typeof INTERVAL_CONFIG
): Promise<Response> {
  const cfg = INTERVAL_CONFIG[interval];
  const ttlMs = cfg.ttlMin * 60_000;

  // is cached data fresh enough?
  const { data: latest } = await supa
    .from("price_history")
    .select("fetched_at")
    .eq("asset_id", assetId)
    .eq("interval", interval)
    .order("time", { ascending: false })
    .limit(1)
    .maybeSingle();

  const cacheFresh = latest && Date.now() - new Date(latest.fetched_at).getTime() < ttlMs;

  if (!cacheFresh) {
    const { data: asset } = await supa
      .from("crypto_assets")
      .select("coingecko_id")
      .eq("id", assetId)
      .maybeSingle();
    if (asset) {
      try {
        const resp = await fetchWithTimeout(
          `${CG}/coins/${asset.coingecko_id}/market_chart?vs_currency=usd&days=${cfg.days}`
        );
        if (resp.ok) {
          const body = await resp.json();
          const prices: [number, number][] = body.prices ?? [];
          const volumes: [number, number][] = body.total_volumes ?? [];
          if (prices.length > 1) {
            // downsample to ~80 points for smooth charts
            const step = Math.max(1, Math.floor(prices.length / 80));
            const rows: {
              asset_id: string; interval: string; time: number;
              open: number; high: number; low: number; close: number; volume: number;
            }[] = [];
            for (let i = 0; i < prices.length; i += step) {
              const slice = prices.slice(i, i + step);
              const vals = slice.map((p) => p[1]);
              const t = slice[0][0];
              const vol = volumes.slice(i, i + step).reduce((s, v) => s + (v[1] ?? 0), 0);
              rows.push({
                asset_id: assetId,
                interval,
                time: Math.floor(t / 1000),
                open: vals[0],
                high: Math.max(...vals),
                low: Math.min(...vals),
                close: vals[vals.length - 1],
                volume: vol,
              });
            }
            // replace cached candles for this asset/interval
            await supa.from("price_history").delete().eq("asset_id", assetId).eq("interval", interval);
            const { error: insErr } = await supa.from("price_history").insert(rows);
            if (insErr) {
              // fall through to serve whatever is cached
            }
          }
        }
      } catch {
        // ignore — serve cached
      }
    }
  }

  const { data: candles, error } = await supa
    .from("price_history")
    .select("time,open,high,low,close,volume")
    .eq("asset_id", assetId)
    .eq("interval", interval)
    .order("time", { ascending: true });
  if (error) return json({ error: "db_error", detail: error.message }, 500);

  // If no candle history yet (e.g. CoinGecko failed), synthesize a flat line from current
  // price so the chart still renders rather than being empty.
  if (!candles || candles.length === 0) {
    const { data: asset } = await supa
      .from("crypto_assets")
      .select("current_price")
      .eq("id", assetId)
      .maybeSingle();
    const p = asset?.current_price ?? 0;
    const now = Math.floor(Date.now() / 1000);
    const span: Record<string, number> = {
      "1H": 3600, "4H": 14400, "1D": 86400, "1W": 604800, "1M": 2592000, "1Y": 31536000,
    };
    const synthetic = Array.from({ length: 30 }, (_, i) => ({
      time: now - span[interval] + Math.floor((span[interval] / 29) * i),
      open: p, high: p, low: p, close: p, volume: 0,
    }));
    return json({ candles: synthetic, synthetic: true });
  }

  return json({ candles, synthetic: false });
}

Deno.serve(handler);
// force redeploy Tue Sep  1 08:31:56 UTC 2026

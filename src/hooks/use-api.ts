import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, callEdge } from "@/lib/supabase";
import { friendlyError } from "@/lib/errors";
import { useToast } from "@/components/ui/toast";
import type {
  CryptoAsset,
  Candle,
  CandleInterval,
  Portfolio,
  Order,
  TradeResult,
  AdminUser,
  AdminStats,
} from "@/types";

export const queryKeys = {
  assets: ["assets"] as const,
  asset: (id: string) => ["asset", id] as const,
  history: (id: string, interval: CandleInterval) => ["history", id, interval] as const,
  portfolio: ["portfolio"] as const,
  orders: (filters?: Record<string, unknown>) => ["orders", filters] as const,
  watchlist: ["watchlist"] as const,
  adminUsers: (search: string, page: number) => ["adminUsers", search, page] as const,
  adminStats: ["adminStats"] as const,
};

// ---------- market data (edge function) ----------

export function useAssets() {
  return useQuery<CryptoAsset[]>({
    queryKey: queryKeys.assets,
    queryFn: async () => {
      const resp = await callEdge({ action: "list" });
      if (!resp.ok) throw new Error("market_data_failed");
      const body = await resp.json();
      if (!body.assets) throw new Error("market_data_failed");
      return body.assets as CryptoAsset[];
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useAsset(assetId: string | undefined) {
  return useQuery<CryptoAsset>({
    queryKey: assetId ? queryKeys.asset(assetId) : ["asset", "none"],
    enabled: !!assetId,
    queryFn: async () => {
      const resp = await callEdge({ action: "detail", asset: assetId! });
      if (!resp.ok) throw new Error("market_data_failed");
      const body = await resp.json();
      if (!body.asset) throw new Error("asset_not_found");
      return body.asset as CryptoAsset;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useHistory(assetId: string | undefined, interval: CandleInterval) {
  return useQuery<{ candles: Candle[]; synthetic: boolean }>({
    queryKey: assetId ? queryKeys.history(assetId, interval) : ["history", "none", interval],
    enabled: !!assetId,
    queryFn: async () => {
      const resp = await callEdge({ action: "history", asset: assetId!, interval });
      if (!resp.ok) throw new Error("market_data_failed");
      const body = await resp.json();
      return { candles: body.candles ?? [], synthetic: body.synthetic ?? false };
    },
    staleTime: 60_000,
  });
}

// ---------- portfolio ----------

export function usePortfolio() {
  return useQuery<Portfolio>({
    queryKey: queryKeys.portfolio,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_portfolio");
      if (error) throw new Error(error.message);
      return data as Portfolio;
    },
    staleTime: 15_000,
  });
}

// ---------- holdings (raw, for portfolio table) ----------

export function useHoldings() {
  return useQuery({
    queryKey: ["holdings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holdings")
        .select("*, crypto_assets!asset_id(symbol,name,image_url,current_price)")
        .gt("quantity", 0);
      if (error) throw new Error(error.message);
      return data;
    },
    staleTime: 15_000,
  });
}

// ---------- trades ----------

export function useTrade() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async ({ assetId, side, quantity }: { assetId: string; side: "BUY" | "SELL"; quantity: number }) => {
      const fn = side === "BUY" ? "buy" : "sell";
      const { data, error } = await supabase.rpc(fn, { p_asset_id: assetId, p_quantity: quantity });
      if (error) throw new Error(error.message);
      return data as TradeResult;
    },
    onSuccess: async (data) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["portfolio"] }),
        qc.invalidateQueries({ queryKey: ["holdings"] }),
        qc.invalidateQueries({ queryKey: ["orders"] }),
        qc.invalidateQueries({ queryKey: ["watchlist"] }),
      ]);
      toast({
        title: `${data.side} confirmed`,
        description: `Filled ${data.quantity} @ $${data.price.toFixed(2)} — virtual cash balance updated.`,
        variant: "success",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Trade failed", description: friendlyError(err.message), variant: "destructive" });
    },
  });
}

// ---------- orders / transaction history ----------

export function useOrders(filters?: { side?: string; search?: string; page?: number; pageSize?: number }) {
  return useQuery<{ rows: Order[]; total: number }>({
    queryKey: queryKeys.orders(filters),
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select("*, crypto_assets!asset_id(symbol,name,image_url)", { count: "exact" })
        .order("created_at", { ascending: false });
      if (filters?.side && filters.side !== "ALL") q = q.eq("side", filters.side);
      const page = filters?.page ?? 1;
      const size = filters?.pageSize ?? 20;
      q = q.range((page - 1) * size, page * size - 1);
      const { data, error, count } = await q;
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as unknown as Order[];
      // client-side search on symbol (server can't easily filter on joined col)
      const filtered = filters?.search
        ? rows.filter((r) =>
            (r.crypto_assets?.symbol ?? "").toLowerCase().includes(filters.search!.toLowerCase()) ||
            (r.crypto_assets?.name ?? "").toLowerCase().includes(filters.search!.toLowerCase())
          )
        : rows;
      return { rows: filtered, total: count ?? 0 };
    },
    staleTime: 10_000,
  });
}

// ---------- watchlist ----------

export function useWatchlist() {
  return useQuery({
    queryKey: queryKeys.watchlist,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("*, asset:crypto_assets(*)")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 15_000,
  });
}

export function useToggleWatchlist() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async ({ assetId, add }: { assetId: string; add: boolean }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("You must be signed in to update your watchlist.");

      if (add) {
        const { error } = await supabase.from("watchlist").insert({
          user_id: userData.user.id,
          asset_id: assetId,
        });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("watchlist").delete().eq("asset_id", assetId);
        if (error) throw new Error(error.message);
      }
    },
    onMutate: async ({ assetId, add }) => {
      await qc.cancelQueries({ queryKey: queryKeys.watchlist });
      const prev = qc.getQueryData(queryKeys.watchlist);
      qc.setQueryData(queryKeys.watchlist, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        if (add) {
          if (old.some((w: { asset_id?: string }) => w.asset_id === assetId)) return old;
          return [...old, { asset_id: assetId }];
        }
        return old.filter((w: { asset_id?: string }) => w.asset_id !== assetId);
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.watchlist, ctx.prev);
      toast({ title: "Couldn't update watchlist", variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.watchlist });
    },
  });
}

// ---------- admin ----------

export function useAdminUsers(search: string, page: number) {
  return useQuery<{ total: number; page: number; page_size: number; users: AdminUser[] }>({
    queryKey: queryKeys.adminUsers(search, page),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users", {
        p_search: search || null,
        p_page: page,
        p_page_size: 20,
      });
      if (error) throw new Error(error.message);
      return data as { total: number; page: number; page_size: number; users: AdminUser[] };
    },
    staleTime: 15_000,
  });
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: queryKeys.adminStats,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) throw new Error(error.message);
      return data as AdminStats;
    },
    staleTime: 15_000,
  });
}

export function useAdminToggleUserStatus() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async ({ userId, disabled }: { userId: string; disabled: boolean }) => {
      const { error } = await supabase.rpc("admin_set_user_status", {
        p_user_id: userId,
        p_disabled: disabled,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminUsers"] });
      qc.invalidateQueries({ queryKey: queryKeys.adminStats });
      toast({ title: "User status updated", variant: "success" });
    },
    onError: (err: Error) => {
      toast({ title: "Action failed", description: friendlyError(err.message), variant: "destructive" });
    },
  });
}

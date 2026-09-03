import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { CoinIcon } from "@/components/coin-icon";
import { ChangeBadge } from "@/components/ui/change";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchlist, useToggleWatchlist } from "@/hooks/use-api";
import { formatPrice, formatINR, cn } from "@/lib/utils";
import type { CryptoAsset } from "@/types";

type SortKey = "rank" | "current_price" | "price_change_percentage_24h" | "total_volume" | "market_cap";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; align?: "right"; hideOnMobile?: boolean }[] = [
  { key: "current_price", label: "Price", align: "right" },
  { key: "price_change_percentage_24h", label: "24h", align: "right" },
  { key: "total_volume", label: "Volume", align: "right", hideOnMobile: true },
  { key: "market_cap", label: "Market Cap", align: "right", hideOnMobile: true },
];

export function MarketTable({
  assets,
  loading,
  pageSize = 10,
  showSearch = true,
  onRowClick,
}: {
  assets: CryptoAsset[];
  loading?: boolean;
  pageSize?: number;
  showSearch?: boolean;
  onRowClick?: (a: CryptoAsset) => void;
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const { data: watchlist } = useWatchlist();
  const toggle = useToggleWatchlist();
  const navigate = useNavigate();

  const watchedIds = useMemo(
    () => new Set((watchlist ?? []).map((w: { asset_id?: string }) => w.asset_id)),
    [watchlist]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? assets.filter(
          (a) => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q)
        )
      : assets;
    const sorted = [...list].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      const cmp = (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [assets, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" ? "asc" : "desc");
    }
    setPage(1);
  };

  const go = (a: CryptoAsset) => {
    if (onRowClick) onRowClick(a);
    else navigate(`/coin/${a.id}`);
  };

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search coins…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Coin
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-3 sm:px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground whitespace-nowrap",
                    col.align === "right" ? "text-right" : "text-left",
                    col.hideOnMobile && "hidden md:table-cell"
                  )}
                  onClick={() => toggleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1 justify-end w-full">
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </span>
                </th>
              ))}
              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Skeleton className="h-6 w-6 sm:h-7 sm:w-7 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                    </td>
                    {COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-3 sm:px-4 py-3",
                          col.hideOnMobile && "hidden md:table-cell"
                        )}
                      >
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </td>
                    ))}
                    <td className="px-3 sm:px-4 py-3">
                      <Skeleton className="h-5 w-5 ml-auto" />
                    </td>
                  </tr>
                ))
              : pageData.map((a) => {
                  const watched = watchedIds.has(a.id);
                  return (
                    <tr
                      key={a.id}
                      className="group cursor-pointer border-b border-border/50 transition-colors hover:bg-secondary/30"
                      onClick={() => go(a)}
                    >
                      <td className="px-3 sm:px-4 py-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="hidden sm:inline-block w-5 text-xs text-muted-foreground tabular">{a.rank ?? "—"}</span>
                          <CoinIcon src={a.image_url} symbol={a.symbol} size={24} className="sm:w-7 sm:h-7" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-sm sm:text-base">{a.name}</p>
                            <p className="text-xs uppercase text-muted-foreground">{a.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right font-medium tabular text-sm">{formatPrice(a.current_price)}</td>
                      <td className="px-3 sm:px-4 py-3 text-right">
                        <ChangeBadge value={a.price_change_percentage_24h} />
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-4 py-3 text-right tabular text-muted-foreground">
                        {formatINR(a.total_volume, { compact: true })}
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-4 py-3 text-right tabular text-muted-foreground">
                        {formatINR(a.market_cap, { compact: true })}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle.mutate({ assetId: a.id, add: !watched });
                          }}
                          aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
                        >
                          <Star
                            className={cn(
                              "h-4 w-4 transition-colors",
                              watched ? "fill-warning text-warning" : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filtered.length}
          itemsPerPage={pageSize}
        />
      )}
    </div>
  );
}

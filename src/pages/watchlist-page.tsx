import { Link } from "react-router-dom";
import { Star, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoinIcon } from "@/components/coin-icon";
import { ChangeBadge } from "@/components/ui/change";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states";
import { useWatchlist, useToggleWatchlist, useAssets } from "@/hooks/use-api";
import { formatPrice, formatCompact } from "@/lib/utils";
import type { CryptoAsset } from "@/types";

export function WatchlistPage() {
  const { data: watchlist, isLoading } = useWatchlist();
  const { data: assets } = useAssets();
  const toggle = useToggleWatchlist();

  // merge live prices from the assets list (kept fresh by useAssets polling)
  const assetMap = new Map((assets ?? []).map((a) => [a.id, a]));
  const items = (watchlist ?? [])
    .map((w: { asset_id?: string; asset?: CryptoAsset }) => ({
      ...w,
      live: w.asset ? assetMap.get(w.asset.id) ?? w.asset : undefined,
    }))
    .filter((w) => w.live);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Star className="h-6 w-6 text-warning" /> Watchlist
        </h1>
        <p className="text-sm text-muted-foreground">Coins you're tracking. Prices update automatically.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Star}
              title="Your watchlist is empty"
              description="Add coins from the markets page to track their prices here."
              action={<Link to="/markets"><Button size="sm">Browse markets</Button></Link>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Coin</th>
                    <th className="px-4 py-3 text-right font-medium">Price</th>
                    <th className="px-4 py-3 text-right font-medium">24h</th>
                    <th className="px-4 py-3 text-right font-medium">Market Cap</th>
                    <th className="px-4 py-3 text-right font-medium">Volume</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(({ live, asset_id }) => {
                    const a = live!;
                    return (
                      <tr key={asset_id} className="border-b border-border/40 hover:bg-secondary/20">
                        <td className="px-4 py-3">
                          <Link to={`/coin/${a.id}`} className="flex items-center gap-2 hover:text-primary">
                            <CoinIcon src={a.image_url} symbol={a.symbol} size={28} />
                            <div>
                              <p className="font-medium">{a.name}</p>
                              <p className="text-xs uppercase text-muted-foreground">{a.symbol}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular">{formatPrice(a.current_price)}</td>
                        <td className="px-4 py-3 text-right"><ChangeBadge value={a.price_change_percentage_24h} /></td>
                        <td className="px-4 py-3 text-right tabular text-muted-foreground">${formatCompact(a.market_cap)}</td>
                        <td className="px-4 py-3 text-right tabular text-muted-foreground">${formatCompact(a.total_volume)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => toggle.mutate({ assetId: a.id, add: false })}
                            aria-label="Remove from watchlist"
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

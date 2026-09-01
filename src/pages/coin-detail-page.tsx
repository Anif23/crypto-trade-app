import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, ShoppingCart, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CoinIcon } from "@/components/coin-icon";
import { ChangeBadge } from "@/components/ui/change";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceChart } from "@/components/price-chart";
import { TradeModal } from "@/components/trade-modal";
import { ErrorState } from "@/components/states";
import { useAsset, useHistory, useWatchlist, useToggleWatchlist, usePortfolio } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice, formatCompact, cn } from "@/lib/utils";
import type { CandleInterval } from "@/types";

const INTERVALS: CandleInterval[] = ["1H", "4H", "1D", "1W", "1M", "1Y"];

export function CoinDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: asset, isLoading, error, refetch } = useAsset(id);
  const [interval, setInterval] = useState<CandleInterval>("1D");
  const { data: hist } = useHistory(id, interval);
  const { data: watchlist } = useWatchlist();
  const toggle = useToggleWatchlist();
  const { session } = useAuth();
  const portfolio = usePortfolio();

  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeSide, setTradeSide] = useState<"BUY" | "SELL">("BUY");

  const watched = !!watchlist?.some((w: { asset_id?: string }) => w.asset_id === id);
  const owned = portfolio.data?.holdings?.find((h) => h.asset_id === id)?.quantity ?? 0;

  const openTrade = (side: "BUY" | "SELL") => {
    if (!session) return;
    setTradeSide(side);
    setTradeOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-5 lg:p-10">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (error || !asset) {
    return <ErrorState title="Coin not found" description="We couldn't load this cryptocurrency." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6 p-5 lg:p-10">
      <Link to="/markets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to markets
      </Link>

      {/* header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CoinIcon src={asset.image_url} symbol={asset.symbol} size={48} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{asset.name}</h1>
              <span className="rounded bg-secondary px-2 py-0.5 text-sm font-medium uppercase text-muted-foreground">
                {asset.symbol}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-xl font-bold tabular">{formatPrice(asset.current_price)}</span>
              <ChangeBadge value={asset.price_change_percentage_24h} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggle.mutate({ assetId: asset.id, add: !watched })}
            aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
          >
            <Star className={cn("h-4 w-4", watched && "fill-warning text-warning")} />
          </Button>
          {session && (
            <>
              <Button variant="success" onClick={() => openTrade("BUY")}>
                <ShoppingCart className="h-4 w-4" /> Buy
              </Button>
              <Button variant="destructive" onClick={() => openTrade("SELL")}>
                <TrendingDown className="h-4 w-4" /> Sell
              </Button>
            </>
          )}
        </div>
      </div>

      {/* stats grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Market Cap" value={`$${formatCompact(asset.market_cap)}`} />
        <Stat label="24h Volume" value={`$${formatCompact(asset.total_volume)}`} />
        <Stat label="24h High" value={formatPrice(asset.high_24h)} />
        <Stat label="24h Low" value={formatPrice(asset.low_24h)} />
      </div>

      {owned > 0 && session && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm">
          <Badge variant="default">Your position</Badge>
          <span className="tabular">{owned} {asset.symbol}</span>
        </div>
      )}

      {/* chart */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-1">
            {INTERVALS.map((iv) => (
              <button
                key={iv}
                onClick={() => setInterval(iv)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  interval === iv ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                )}
              >
                {iv}
              </button>
            ))}
          </div>
          {hist?.synthetic && (
            <div className="mb-3 rounded-md bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
              Live chart data temporarily unavailable — showing the latest price.
            </div>
          )}
          <PriceChart candles={hist?.candles ?? []} interval={interval} synthetic={hist?.synthetic} height={360} />
        </CardContent>
      </Card>

      <TradeModal
        open={tradeOpen}
        onOpenChange={setTradeOpen}
        asset={asset}
        side={tradeSide}
        ownedQuantity={owned}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular">{value}</p>
    </Card>
  );
}

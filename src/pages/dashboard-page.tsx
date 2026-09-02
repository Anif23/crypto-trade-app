import { Link } from "react-router-dom";
import { Wallet, TrendingUp, TrendingDown, ArrowRight, Star, Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoinIcon } from "@/components/coin-icon";
import { ChangeBadge, PnlText } from "@/components/ui/change";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketTable } from "@/components/market-table";
import { EmptyState, ErrorState } from "@/components/states";
import { usePortfolio, useAssets, useOrders, useWatchlist } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { formatUSD, formatPrice, formatQuantity, formatDateTime } from "@/lib/utils";
import type { CryptoAsset } from "@/types";

export function DashboardPage() {
  const { profile } = useAuth();
  const portfolio = usePortfolio();
  const assets = useAssets();
  const orders = useOrders({ pageSize: 5 });
  const watchlist = useWatchlist();

  const p = portfolio.data;
  const gainers = (assets.data ?? [])
    .slice()
    .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
    .slice(0, 5);
  const losers = (assets.data ?? [])
    .slice()
    .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
    .slice(0, 5);

  const watchedAssets = (watchlist.data ?? [])
    .map((w: { asset?: CryptoAsset }) => w.asset)
    .filter(Boolean) as CryptoAsset[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {profile?.display_name?.split(" ")[0] ?? "Trader"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here's an overview of your paper-trading portfolio and the market.
        </p>
      </div>

      {/* summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Portfolio Value"
          value={portfolio.isLoading ? null : formatUSD(p?.total_value ?? 0)}
          icon={<Wallet className="h-4 w-4" />}
          loading={portfolio.isLoading}
        />
        <SummaryCard
          label="Available Cash"
          value={portfolio.isLoading ? null : formatUSD(p?.cash ?? 0)}
          icon={<Wallet className="h-4 w-4" />}
          sub="Virtual INR"
          loading={portfolio.isLoading}
        />
        <SummaryCard
          label="Total P&L"
          value={portfolio.isLoading ? null : formatUSD(p?.total_pnl ?? 0)}
          valueNode={portfolio.isLoading ? null : <PnlText value={p?.total_pnl ?? 0} />}
          icon={p && p.total_pnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          loading={portfolio.isLoading}
        />
        <SummaryCard
          label="Today's P&L"
          value={portfolio.isLoading ? null : formatUSD(p?.today_pnl ?? 0)}
          valueNode={portfolio.isLoading ? null : <PnlText value={p?.today_pnl ?? 0} />}
          icon={p && p.today_pnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          loading={portfolio.isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* watchlist */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-warning" /> Watchlist
            </CardTitle>
            <Link to="/watchlist"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent>
            {watchlist.isLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : watchedAssets.length === 0 ? (
              <EmptyState icon={Star} title="No watched coins" description="Add coins from the markets page to track them here." />
            ) : (
              <div className="space-y-1">
                {watchedAssets.slice(0, 5).map((a) => (
                  <Link
                    key={a.id}
                    to={`/coin/${a.id}`}
                    className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-2">
                      <CoinIcon src={a.image_url} symbol={a.symbol} size={26} />
                      <div>
                        <p className="text-sm font-medium">{a.symbol}</p>
                        <p className="text-xs text-muted-foreground">{a.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular">{formatPrice(a.current_price)}</p>
                      <ChangeBadge value={a.price_change_percentage_24h} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* gainers/losers */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top movers (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            {assets.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                <MoverList title="Top gainers" assets={gainers} />
                <MoverList title="Top losers" assets={losers} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* recent transactions */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent transactions</CardTitle>
          <Link to="/orders"><Button variant="ghost" size="sm">View all <ArrowRight className="h-4 w-4" /></Button></Link>
        </CardHeader>
        <CardContent>
          {orders.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : orders.data && orders.data.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Coin</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 text-right font-medium">Qty</th>
                    <th className="pb-2 text-right font-medium">Price</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.data.rows.slice(0, 5).map((o) => (
                    <tr key={o.id} className="border-b border-border/40">
                      <td className="py-2.5 text-muted-foreground">{formatDateTime(o.created_at)}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <CoinIcon src={o.crypto_assets?.image_url} symbol={o.crypto_assets?.symbol ?? ""} size={22} />
                          <span className="font-medium uppercase">{o.crypto_assets?.symbol}</span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className={o.side === "BUY" ? "text-success" : "text-destructive"}>{o.side}</span>
                      </td>
                      <td className="py-2.5 text-right tabular">{formatQuantity(o.quantity)}</td>
                      <td className="py-2.5 text-right tabular">{formatPrice(o.price)}</td>
                      <td className="py-2.5 text-right tabular font-medium">{formatUSD(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Eye}
              title="No transactions yet"
              description="Your completed trades will appear here. Start by buying your first coin."
              action={<Link to="/markets"><Button size="sm">Go to markets</Button></Link>}
            />
          )}
        </CardContent>
      </Card>

      {/* market table */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Market</h2>
          <Link to="/markets"><Button variant="ghost" size="sm">Full market <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
        {assets.error ? (
          <ErrorState onRetry={() => assets.refetch()} />
        ) : (
          <MarketTable assets={assets.data ?? []} loading={assets.isLoading} pageSize={8} showSearch={false} />
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueNode,
  icon,
  sub,
  loading,
}: {
  label: string;
  value: string | null;
  valueNode?: React.ReactNode;
  icon: React.ReactNode;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">{icon}</div>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-32" />
      ) : (
        <p className="mt-3 text-2xl font-bold tabular">{valueNode ?? value}</p>
      )}
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function MoverList({ title, assets }: { title: string; assets: CryptoAsset[] }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-muted-foreground">{title}</p>
      <div className="space-y-1">
        {assets.map((a) => (
          <Link
            key={a.id}
            to={`/coin/${a.id}`}
            className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-2">
              <CoinIcon src={a.image_url} symbol={a.symbol} size={24} />
              <div>
                <p className="text-sm font-medium">{a.symbol}</p>
                <p className="text-xs text-muted-foreground">{a.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm tabular">{formatPrice(a.current_price)}</p>
              <ChangeBadge value={a.price_change_percentage_24h} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

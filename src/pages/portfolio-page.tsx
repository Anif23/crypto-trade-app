import { Link } from "react-router-dom";
import { Wallet, TrendingUp, TrendingDown, Coins, PieChart as PieIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoinIcon } from "@/components/coin-icon";
import { ChangeBadge, PnlText } from "@/components/ui/change";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/states";
import { usePortfolio } from "@/hooks/use-api";
import { formatUSD, formatPrice, formatQuantity, cn } from "@/lib/utils";

export function PortfolioPage() {
  const { data, isLoading, error, refetch } = usePortfolio();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (error) return <ErrorState onRetry={() => refetch()} />;

  const p = data!;
  const totalValue = p.total_value || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Track your virtual holdings and performance.</p>
      </div>

      {/* summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Balance" value={formatUSD(p.total_value)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Available Cash" value={formatUSD(p.cash)} icon={<Coins className="h-4 w-4" />} sub="Virtual INR" />
        <StatCard
          label="Invested Value"
          value={formatUSD(p.invested)}
          icon={<TrendingUp className="h-4 w-4" />}
          sub={`Current: ${formatUSD(p.current_value)}`}
        />
        <StatCard
          label="Total P&L"
          value={formatUSD(p.total_pnl)}
          valueNode={<PnlText value={p.total_pnl} />}
          icon={p.total_pnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          sub={`Today: `}
          subNode={<PnlText value={p.today_pnl} />}
        />
      </div>

      {/* holdings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieIcon className="h-4 w-4" /> Holdings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {p.holdings.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No holdings yet"
              description="You haven't bought any cryptocurrencies. Start trading to build your portfolio."
              action={<Link to="/markets"><Button size="sm">Start trading</Button></Link>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">Asset</th>
                    <th className="px-2 sm:px-3 pb-3 text-right font-medium">Quantity</th>
                    <th className="px-2 sm:px-3 pb-3 text-right font-medium hidden md:table-cell">Avg Buy</th>
                    <th className="px-2 sm:px-3 pb-3 text-right font-medium">Current</th>
                    <th className="px-2 sm:px-3 pb-3 text-right font-medium">Value</th>
                    <th className="px-2 sm:px-3 pb-3 text-right font-medium">P&L</th>
                    <th className="px-2 sm:px-3 pb-3 text-right font-medium hidden lg:table-cell">Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {p.holdings.map((h) => {
                    const alloc = (h.current_value / totalValue) * 100;
                    return (
                      <tr key={h.asset_id} className="border-b border-border/40 hover:bg-secondary/20">
                        <td className="py-3">
                          <Link to={`/coin/${h.asset_id}`} className="flex items-center gap-2 hover:text-primary">
                            <CoinIcon src={h.image_url} symbol={h.symbol} size={24} className="sm:w-7 sm:h-7" />
                            <div>
                              <p className="font-medium text-sm sm:text-base uppercase">{h.symbol}</p>
                              <p className="text-xs text-muted-foreground hidden sm:block">{h.name}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-right tabular text-sm">{formatQuantity(h.quantity)}</td>
                        <td className="px-2 sm:px-3 py-3 text-right tabular text-muted-foreground text-sm hidden md:table-cell">{formatPrice(h.avg_buy_price)}</td>
                        <td className="px-2 sm:px-3 py-3 text-right tabular text-sm">{formatPrice(h.current_price)}</td>
                        <td className="px-2 sm:px-3 py-3 text-right tabular font-medium text-sm">{formatUSD(h.current_value)}</td>
                        <td className="px-2 sm:px-3 py-3 text-right">
                          <PnlText value={h.pnl} className="text-sm" />
                          <div className="text-xs"><ChangeBadge value={h.pnl_pct} /></div>
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-right hidden lg:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn("h-full rounded-full", h.pnl >= 0 ? "bg-success" : "bg-destructive")}
                                style={{ width: `${Math.min(100, alloc)}%` }}
                              />
                            </div>
                            <span className="tabular text-xs text-muted-foreground">{alloc.toFixed(1)}%</span>
                          </div>
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

function StatCard({
  label,
  value,
  valueNode,
  icon,
  sub,
  subNode,
}: {
  label: string;
  value: string;
  valueNode?: React.ReactNode;
  icon: React.ReactNode;
  sub?: string;
  subNode?: React.ReactNode;
}) {
  return (
    <Card className="p-3 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-bold tabular">{valueNode ?? value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}{subNode}</p>
    </Card>
  );
}

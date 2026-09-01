import { useState } from "react";
import { Link } from "react-router-dom";
import { History, Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CoinIcon } from "@/components/coin-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/states";
import { useOrders } from "@/hooks/use-api";
import { formatUSD, formatPrice, formatQuantity, formatDateTime } from "@/lib/utils";

const SIDES = ["ALL", "BUY", "SELL"];

export function OrdersPage() {
  const [side, setSide] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useOrders({ side, search, page, pageSize: 15 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <History className="h-6 w-6 text-primary" /> Orders
        </h1>
        <p className="text-sm text-muted-foreground">Your complete paper-trading transaction history.</p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Transaction history</CardTitle>
            <div className="flex gap-1">
              {SIDES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSide(s); setPage(1); }}
                  className={
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                    (side === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by coin…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : data && data.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Coin</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 text-right font-medium">Quantity</th>
                    <th className="pb-3 text-right font-medium">Price</th>
                    <th className="pb-3 text-right font-medium">Total</th>
                    <th className="pb-3 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((o) => (
                    <tr key={o.id} className="border-b border-border/40 hover:bg-secondary/20">
                      <td className="py-3 text-muted-foreground">{formatDateTime(o.created_at)}</td>
                      <td className="py-3">
                        <Link to={`/coin/${o.asset_id}`} className="flex items-center gap-2 hover:text-primary">
                          <CoinIcon src={o.crypto_assets?.image_url} symbol={o.crypto_assets?.symbol ?? ""} size={24} />
                          <div>
                            <p className="font-medium uppercase">{o.crypto_assets?.symbol}</p>
                            <p className="text-xs text-muted-foreground">{o.crypto_assets?.name}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3">
                        <Badge variant={o.side === "BUY" ? "success" : "destructive"}>{o.side}</Badge>
                      </td>
                      <td className="py-3 text-right tabular">{formatQuantity(o.quantity)}</td>
                      <td className="py-3 text-right tabular">{formatPrice(o.price)}</td>
                      <td className="py-3 text-right tabular font-medium">{formatUSD(o.total)}</td>
                      <td className="py-3 text-right">
                        <Badge variant="muted">{o.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Page {page}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={data.rows.length < 15} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="No transactions found"
              description="Your completed trades will appear here. Start by buying your first coin."
              action={<Link to="/markets"><Button size="sm">Go to markets</Button></Link>}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

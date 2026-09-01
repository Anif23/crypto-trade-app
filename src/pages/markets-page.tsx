import { useState } from "react";
import { ArrowLeft, LineChart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MarketTable } from "@/components/market-table";
import { ErrorState } from "@/components/states";
import { useAssets } from "@/hooks/use-api";
import { Link } from "react-router-dom";

export function MarketsPage() {
  const { data, isLoading, error, refetch } = useAssets();
  const [size] = useState(15);

  return (
    <div className="space-y-6 p-5 lg:p-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
      <div className="flex items-center gap-2">
        <LineChart className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Markets</h1>
          <p className="text-sm text-muted-foreground">Live cryptocurrency prices — paper trading only.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">All cryptocurrencies</CardTitle>
          <span className="text-xs text-muted-foreground">{data?.length ?? 0} coins</span>
        </CardHeader>
        <CardContent>
          {error ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <MarketTable assets={data ?? []} loading={isLoading} pageSize={size} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

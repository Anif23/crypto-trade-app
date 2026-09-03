import { useState } from "react";
import { ShieldCheck, Users, Activity, DollarSign, Search, Ban, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ErrorState } from "@/components/states";
import { useAdminUsers, useAdminStats, useAdminToggleUserStatus } from "@/hooks/use-api";
import { formatUSD, formatCompact, formatDateTime } from "@/lib/utils";

export function AdminPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const users = useAdminUsers(search, page);
  const stats = useAdminStats();
  const toggle = useAdminToggleUserStatus();
  const [pending, setPending] = useState<{ id: string; disabled: boolean; name: string } | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform oversight and user management.</p>
        </div>
      </div>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4" />} label="Total Users" value={stats.isLoading ? null : String(stats.data?.total_users ?? 0)} loading={stats.isLoading} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Active Users" value={stats.isLoading ? null : String(stats.data?.active_users ?? 0)} loading={stats.isLoading} />
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="Total Trades" value={stats.isLoading ? null : String(stats.data?.total_trades ?? 0)} loading={stats.isLoading} />
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="Trade Volume" value={stats.isLoading ? null : formatUSD(stats.data?.trade_volume ?? 0)} loading={stats.isLoading} />
      </div>

      {/* popular coins + recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Popular cryptocurrencies</CardTitle></CardHeader>
          <CardContent>
            {stats.isLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : stats.data && stats.data.top_coins.length > 0 ? (
              <div className="space-y-2">
                {stats.data.top_coins.map((c) => (
                  <div key={c.symbol} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold uppercase">{c.symbol}</p>
                      <p className="text-xs text-muted-foreground">{c.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular">{c.trade_count} trades</p>
                      <p className="text-xs text-muted-foreground tabular">{formatUSD(c.volume)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No trades yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent activity</CardTitle></CardHeader>
          <CardContent>
            {stats.isLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : stats.data && stats.data.recent_trades.length > 0 ? (
              <div className="space-y-2">
                {stats.data.recent_trades.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={t.side === "BUY" ? "success" : "destructive"}>{t.side}</Badge>
                      <div>
                        <p className="text-sm font-medium uppercase">{t.symbol}</p>
                        <p className="text-xs text-muted-foreground">{t.user_email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm tabular">{formatUSD(t.total)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(t.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No recent activity.</p>}
          </CardContent>
        </Card>
      </div>

      {/* users table */}
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-base">User management</CardTitle>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {users.error ? (
            <ErrorState onRetry={() => users.refetch()} />
          ) : users.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : users.data && users.data.users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="w-[28%] pb-3 pr-4 text-left font-medium">User</th>
                    <th className="w-[10%] pb-3 pr-4 text-left font-medium">Role</th>
                    <th className="w-[14%] pb-3 px-4 text-right font-medium">Balance</th>
                    <th className="w-[10%] pb-3 px-4 text-right font-medium">Trades</th>
                    <th className="w-[14%] pb-3 px-4 text-right font-medium">Volume</th>
                    <th className="w-[14%] pb-3 px-4 text-right font-medium">Joined</th>
                    <th className="w-[10%] pb-3 pl-4 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.users.map((u) => (
                    <tr key={u.id} className="border-b border-border/40">
                      <td className="py-3 pr-4">
                        <p className="truncate font-medium">{u.display_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <Badge variant={u.role === "ADMIN" ? "default" : "muted"}>{u.role}</Badge>
                      </td>
                      <td className="whitespace-nowrap py-3 px-4 text-right tabular">{formatUSD(u.virtual_cash_balance)}</td>
                      <td className="whitespace-nowrap py-3 px-4 text-right tabular">{u.trade_count}</td>
                      <td className="whitespace-nowrap py-3 px-4 text-right tabular text-muted-foreground">{formatCompact(u.trade_volume)}</td>
                      <td className="whitespace-nowrap py-3 px-4 text-right text-muted-foreground">{formatDateTime(u.created_at)}</td>
                      <td className="py-3 pl-4 text-right">
                        {u.disabled ? (
                          <Button variant="outline" size="sm" onClick={() => setPending({ id: u.id, disabled: false, name: u.email })}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Enable
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="text-destructive" onClick={() => setPending({ id: u.id, disabled: true, name: u.email })}>
                            <Ban className="h-3.5 w-3.5" /> Disable
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{users.data.total} users · page {page}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={users.data.users.length < 20} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(v) => !v && setPending(null)}
        title={pending?.disabled ? "Disable user?" : "Enable user?"}
        description={`This will ${pending?.disabled ? "prevent" : "allow"} ${pending?.name} from accessing the platform.`}
        confirmLabel={pending?.disabled ? "Disable" : "Enable"}
        variant={pending?.disabled ? "destructive" : "success"}
        loading={toggle.isPending}
        onConfirm={() => {
          if (pending) {
            toggle.mutate({ userId: pending.id, disabled: pending.disabled }, { onSettled: () => setPending(null) });
          }
        }}
      />
    </div>
  );
}

function StatCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: string | null; loading?: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">{icon}</div>
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-3 text-2xl font-bold tabular">{value}</p>}
    </Card>
  );
}
